import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Combined API router
export const apiCombinedRouter = express.Router();

// Endpoint to combine data from both CSV files and remove duplicates
apiCombinedRouter.get("/combined", async (_req, res, next) => {
  try {
    const toolifyPath = path.resolve(__dirname, "../../../public/data/toolify.csv");
    const opentoolsPath = path.resolve(__dirname, "../../../public/data/opentools.csv");
    const combinedPath = path.resolve(__dirname, "../../../public/data/combined-tools.csv");

    // Check if both files exist
    if (!fs.existsSync(toolifyPath) || !fs.existsSync(opentoolsPath)) {
      return res.status(404).json({ error: "CSV files not found. Please generate them first." });
    }

    // Read both CSV files
    const toolifyData = fs.readFileSync(toolifyPath, "utf8");
    const opentoolsData = fs.readFileSync(opentoolsPath, "utf8");

    // Parse CSV data
    const toolifyLines = toolifyData.split("\n").filter((line) => line.trim());
    const opentoolsLines = opentoolsData.split("\n").filter((line) => line.trim());

    // Extract headers (should be the same for both files)
    const headers = toolifyLines[0];

    // Combine data (excluding headers from the second file)
    const combinedLines = [headers, ...toolifyLines.slice(1), ...opentoolsLines.slice(1)];

    // Create a map to track unique tools by website URL
    const uniqueTools = new Map();
    const headerFields = headers.split(",");
    const websiteIndex = headerFields.indexOf("website");
    const nameIndex = headerFields.indexOf("name");

    // Process each line (skip header)
    for (let i = 1; i < combinedLines.length; i++) {
      const line = combinedLines[i];
      const fields = line.split(",");

      // Use website as primary key, fallback to name if website is empty
      const website = fields[websiteIndex]?.replace(/"/g, "").trim();
      const name = fields[nameIndex]?.replace(/"/g, "").trim();
      const key = website || name;

      if (key && !uniqueTools.has(key)) {
        uniqueTools.set(key, line);
      }
    }

    // Convert map back to array and join with newlines
    const uniqueLines = [headers, ...Array.from(uniqueTools.values())];
    const uniqueData = uniqueLines.join("\n");

    // Ensure the directory exists
    const dirPath = path.dirname(combinedPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Write to combined CSV file
    fs.writeFileSync(combinedPath, uniqueData, "utf8");

    console.info(`Successfully wrote ${uniqueTools.size} unique tools to ${combinedPath}`);
    res.json({
      message: `Successfully wrote ${uniqueTools.size} unique tools to public/data/combined-tools.csv`,
      filePath: combinedPath,
      count: uniqueTools.size,
    });
  } catch (error) {
    console.error("Error combining CSV data:", error);
    next(error);
  }
});

export default apiCombinedRouter;
