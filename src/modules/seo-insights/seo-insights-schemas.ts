import { z } from "zod";

// Helper function to validate domain or URL
const validateDomainOrUrl = (value: string) => {
  // Check if it's already a valid URL
  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      new URL(value);
      return value;
    } catch {
      throw new Error("Invalid URL format");
    }
  }
  // If it's just a domain, validate it has at least one dot and no spaces
  if (value.includes(".") && !value.includes(" ")) {
    return value;
  }
  throw new Error("Please provide a valid domain or URL");
};

// Schema for backlinks request
export const BacklinksRequestSchema = z.object({
  domain: z.string().refine(validateDomainOrUrl, {
    message: "Please provide a valid domain or URL",
  }),
});

export type BacklinksRequest = z.infer<typeof BacklinksRequestSchema>;

// Schema for keyword ideas request
export const KeywordIdeasRequestSchema = z.object({
  keyword: z.string().min(1, "Keyword is required"),
  country: z.string().optional().default("us"),
  searchEngine: z.string().optional().default("Google"),
});

export type KeywordIdeasRequest = z.infer<typeof KeywordIdeasRequestSchema>;

// Schema for keyword difficulty request
export const KeywordDifficultyRequestSchema = z.object({
  keyword: z.string().min(1, "Keyword is required"),
  country: z.string().optional().default("us"),
});

export type KeywordDifficultyRequest = z.infer<typeof KeywordDifficultyRequestSchema>;

// Schema for traffic check request
export const TrafficCheckRequestSchema = z.object({
  domainOrUrl: z.string().refine(validateDomainOrUrl, {
    message: "Please provide a valid domain or URL",
  }),
  mode: z.enum(["subdomains", "exact"]).optional().default("subdomains"),
  country: z.string().optional().default("None"),
});

export type TrafficCheckRequest = z.infer<typeof TrafficCheckRequestSchema>;
