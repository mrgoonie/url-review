import AdmZip from "adm-zip";
import { randomUUID } from "crypto";
import fs from "fs";
import os from "os";
import path from "path";

interface ExtractResult {
  /** Absolute path to the extracted directory */
  extractDir: string;
  /** Call to remove the temp directory */
  cleanup: () => void;
}

/**
 * Extract a ZIP buffer to a temporary directory with zip-slip protection.
 *
 * @param zipBuffer - The ZIP file as a Buffer
 * @param maxSizeBytes - Maximum allowed ZIP size (default: 50MB)
 * @returns extractDir path and cleanup function
 */
export async function extractZipToTempDir(
  zipBuffer: Buffer,
  maxSizeBytes = 50 * 1024 * 1024
): Promise<ExtractResult> {
  if (zipBuffer.length > maxSizeBytes) {
    throw new Error(`ZIP file exceeds max size of ${maxSizeBytes} bytes`);
  }

  const sessionId = randomUUID();
  const extractDir = path.join(os.tmpdir(), "html-render", sessionId);
  fs.mkdirSync(extractDir, { recursive: true });

  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();

  // Decompression bomb protection: limit extracted size and entry count
  const MAX_EXTRACTED_BYTES = 200 * 1024 * 1024; // 200MB uncompressed limit
  const MAX_ENTRIES = 500;

  if (entries.length > MAX_ENTRIES) {
    fs.rmSync(extractDir, { recursive: true, force: true });
    throw new Error(`ZIP contains too many entries (${entries.length}, max ${MAX_ENTRIES})`);
  }

  let totalExtractedSize = 0;
  const resolvedExtractDir = path.resolve(extractDir);

  for (const entry of entries) {
    // Track cumulative extracted size
    totalExtractedSize += entry.header.size;
    if (totalExtractedSize > MAX_EXTRACTED_BYTES) {
      fs.rmSync(extractDir, { recursive: true, force: true });
      throw new Error("Extracted content exceeds max size (200MB)");
    }

    // Zip-slip protection: validate all entry paths before extraction
    const targetPath = path.join(extractDir, entry.entryName);
    const resolvedPath = path.resolve(targetPath);
    if (!resolvedPath.startsWith(resolvedExtractDir + path.sep) && resolvedPath !== resolvedExtractDir) {
      fs.rmSync(extractDir, { recursive: true, force: true });
      throw new Error(`Zip-slip detected: ${entry.entryName}`);
    }
  }

  zip.extractAllTo(extractDir, true);

  const cleanup = () => {
    try {
      fs.rmSync(extractDir, { recursive: true, force: true });
    } catch {
      /* ignore cleanup errors */
    }
  };

  return { extractDir, cleanup };
}
