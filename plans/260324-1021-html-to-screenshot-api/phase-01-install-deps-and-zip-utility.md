# Phase 1: Install Dependencies & ZIP Utility

## Overview
- **Priority**: High
- **Status**: Pending
- **Description**: Install `adm-zip`, create safe ZIP extraction utility with zip-slip protection

## Context Links
- [Brainstorm Report](../reports/brainstorm-260324-1021-html-to-screenshot-api.md)
- Existing utils: `src/lib/utils/`

## Requirements

### Functional
- Extract ZIP files to temp directory
- Support nested directory structures in ZIP
- Return path to extracted root directory

### Non-functional
- Zip-slip attack prevention (path traversal)
- Max file size: 50MB
- Auto-cleanup helper for temp directories

## Related Code Files

### Create
- `src/lib/utils/extract-zip-to-temp-dir.ts` — safe ZIP extraction utility

### Modify
- `package.json` — add `adm-zip` + `@types/adm-zip`

## Implementation Steps

1. Install dependencies:
   ```bash
   bun add adm-zip
   bun add -d @types/adm-zip
   ```

2. Create `src/lib/utils/extract-zip-to-temp-dir.ts`:
   ```typescript
   import AdmZip from "adm-zip";
   import fs from "fs";
   import os from "os";
   import path from "path";
   import { randomUUID } from "crypto";

   interface ExtractResult {
     extractDir: string;    // absolute path to extracted directory
     cleanup: () => void;   // call to remove temp dir
   }

   export async function extractZipToTempDir(
     zipBuffer: Buffer,
     maxSizeBytes = 50 * 1024 * 1024
   ): Promise<ExtractResult> {
     // validate size
     if (zipBuffer.length > maxSizeBytes) {
       throw new Error(`ZIP file exceeds max size of ${maxSizeBytes} bytes`);
     }

     const sessionId = randomUUID();
     const extractDir = path.join(os.tmpdir(), "html-render", sessionId);
     fs.mkdirSync(extractDir, { recursive: true });

     const zip = new AdmZip(zipBuffer);
     const entries = zip.getEntries();

     // zip-slip protection: validate all paths before extraction
     for (const entry of entries) {
       const targetPath = path.join(extractDir, entry.entryName);
       const resolvedPath = path.resolve(targetPath);
       if (!resolvedPath.startsWith(path.resolve(extractDir))) {
         // cleanup on failure
         fs.rmSync(extractDir, { recursive: true, force: true });
         throw new Error(`Zip-slip detected: ${entry.entryName}`);
       }
     }

     zip.extractAllTo(extractDir, true);

     const cleanup = () => {
       try {
         fs.rmSync(extractDir, { recursive: true, force: true });
       } catch { /* ignore cleanup errors */ }
     };

     return { extractDir, cleanup };
   }
   ```

3. Verify compilation: `bun run start` or `tsc --noEmit`

## Todo List
- [ ] Install `adm-zip` and `@types/adm-zip`
- [ ] Create `extract-zip-to-temp-dir.ts` with zip-slip protection
- [ ] Verify compilation passes

## Success Criteria
- `adm-zip` installed and types available
- `extractZipToTempDir()` extracts ZIP to temp dir
- Zip-slip attack is detected and blocked
- Cleanup function removes temp files

## Risk Assessment
- **Zip-slip attack**: Mitigated by path validation before extraction
- **Disk space**: Mitigated by 50MB limit + cleanup

## Security Considerations
- All ZIP entry paths validated against resolved extractDir
- Temp files always cleaned up via `cleanup()` callback
