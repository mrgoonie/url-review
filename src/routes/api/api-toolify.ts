import axios from "axios";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Toolify API router
// Tag: Scrape
export const apiToolifyRouter = express.Router();

// Helper function to safely format CSV fields (handles commas and quotes)
const formatCsvField = (field: any): string => {
  if (field === null || typeof field === "undefined") {
    return "";
  }
  const str = String(field);
  // Escape double quotes by doubling them and wrap in double quotes if it contains comma, newline or double quote
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

apiToolifyRouter.get("/toolify", async (_req, res, next) => {
  try {
    const response = await axios.get(
      "https://www.toolify.ai/self-api/v1/tools/search/list?created_at_start=2023-01-01&created_at_end=2023-12-31&page=1&per_page=10000&order_by=month_visited_count"
    );

    // Check if data exists and has the expected structure
    if (!response.data || !response.data.data || !Array.isArray(response.data.data.data)) {
      console.error("Invalid data structure received from Toolify API");
      return res.status(500).json({ error: "Invalid data structure from API" });
    }

    const tools = response.data.data.data;
    const csvFilePath = path.resolve(__dirname, "../../../public/data/toolify.csv");

    // Define standardized CSV headers for both toolify and opentools
    const headers = [
      "name",
      "id",
      "slug",
      "website",
      "image",
      "description",
      "category",
      "month_visited_count",
      "pricing",
      "tags",
    ];

    // Map the tools to match our standardized CSV structure
    const mappedTools = tools.map((tool: any) => {
      // Format tags if available
      let tags = "";
      if (tool.categories && tool.categories.length > 0) {
        tags = tool.categories.map((cat: any) => cat.name).join(" | ");
      }

      return {
        name: tool.name || "",
        id: tool.id || "",
        slug: tool.handle || "",
        website: tool.website || "",
        image: tool.image || "",
        description: tool.description || tool.what_is_summary || "",
        category: tool.categories && tool.categories.length > 0 ? tool.categories[0].name : "",
        month_visited_count: tool.month_visited_count || 0,
        pricing: "", // Toolify doesn't have pricing info
        tags: tags,
      };
    });

    // Create CSV header row
    const csvHeader = headers.join(",");

    // Create CSV data rows
    const csvRows = mappedTools.map((tool: any) => {
      return headers.map((header) => formatCsvField(tool[header])).join(",");
    });

    // Combine header and rows
    const csvContent = [csvHeader, ...csvRows].join("\n");

    // Ensure the directory exists
    const dirPath = path.dirname(csvFilePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Write CSV content to file
    fs.writeFileSync(csvFilePath, csvContent, "utf-8");

    console.info(`Successfully wrote ${tools.length} tools to ${csvFilePath}`);
    res.json({
      message: `Successfully wrote ${tools.length} tools to public/data/toolify.csv`,
      filePath: csvFilePath,
      count: tools.length,
    });
  } catch (error) {
    console.error("Error fetching or processing Toolify data:", error);
    // Pass error to the error handling middleware
    next(error);
  }
});

apiToolifyRouter.get("/opentools", async (_req, res, next) => {
  try {
    const response = await axios.get("https://opentools.ai/api/tools?limit=5982");

    // Check if data exists and is an array
    if (!response.data || !Array.isArray(response.data.data)) {
      console.error("Invalid data structure received from OpenTools API");
      return res.status(500).json({ error: "Invalid data structure from API" });
    }

    const tools = response.data.data;
    const csvFilePath = path.resolve(__dirname, "../../../public/data/opentools.csv");

    // Define standardized CSV headers (same as toolify)
    const headers = [
      "name",
      "id",
      "slug",
      "website",
      "image",
      "description",
      "category",
      "month_visited_count",
      "pricing",
      "tags",
    ];

    // Map OpenTools data structure for CSV
    const mappedTools = tools.map((tool: any) => {
      // Determine pricing information
      let pricing = "";
      if (tool.pricing_plans && tool.pricing_plans.length > 0) {
        pricing = tool.pricing_plans
          .map(
            (plan: any) =>
              `${plan.title}: ${plan.price}${plan.currency || "$"} ${
                plan.cost_frequency || "monthly"
              }`
          )
          .join(" | ");
      }

      // Format tags
      const tags = Array.isArray(tool.tags) ? tool.tags.join(" | ") : "";

      return {
        name: tool.tool_name || "",
        id: tool.id || "",
        slug: tool.slug || "",
        website: tool.tool_url || "",
        image: tool.thumbnail_image || "",
        description: tool.meta_description || tool.headline || "",
        category: tool.category || "",
        month_visited_count: tool.monthFavourites || 0,
        pricing: pricing,
        tags: tags,
      };
    });

    // Create CSV header row
    const csvHeader = headers.join(",");

    // Create CSV data rows
    const csvRows = mappedTools.map((tool: any) => {
      return headers.map((header) => formatCsvField(tool[header])).join(",");
    });

    // Combine header and rows
    const csvContent = [csvHeader, ...csvRows].join("\n");

    // Ensure the directory exists
    const dirPath = path.dirname(csvFilePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Write CSV content to file
    fs.writeFileSync(csvFilePath, csvContent, "utf-8");

    console.info(`Successfully wrote ${tools.length} tools to ${csvFilePath}`);
    res.json({
      message: `Successfully wrote ${tools.length} tools to public/data/opentools.csv`,
      filePath: csvFilePath,
      count: tools.length,
    });
  } catch (error) {
    console.error("Error fetching or processing OpenTools data:", error);
    // Pass error to the error handling middleware
    next(error);
  }
});
