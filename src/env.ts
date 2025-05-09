/* eslint-disable no-unused-vars */
import { toInt } from "diginext-utils/dist/object";
import dotenv from "dotenv";
import z from "zod";

dotenv.config();

export const envSchema = z.object({
  DATABASE_URL: z.string(),
  PORT: z.number(),
  NODE_ENV: z.string(),
  BASE_URL: z.string(),
  SITE_NAME: z.string().default("ReviewWeb.site"),
  SITE_DESCRIPTION: z
    .string()
    .default(
      "ReviewWeb.site is a tool that uses AI to review and analyze URLs for detecting inappropriate content."
    ),
  SITE_KEYWORDS: z.string(),
  LOCALE: z.string(),
  TZ: z.string(),
  APP_SECRET: z.string(),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  REDIS_PREFIX: z.string().optional(),
  REDIS_URL: z.string().optional(),
  CLOUDFLARE_CDN_PROJECT_NAME: z.string(),
  CLOUDFLARE_CDN_ACCESS_KEY: z.string(),
  CLOUDFLARE_CDN_SECRET_KEY: z.string(),
  CLOUDFLARE_CDN_BUCKET_NAME: z.string(),
  CLOUDFLARE_CDN_ENDPOINT_URL: z.string(),
  CLOUDFLARE_CDN_BASE_URL: z.string(),
  WEBSHAREIO_API_KEY: z.string(),
  PROXY_URL: z.string(),
  OPENROUTER_KEY: z.string(),
  UPFILEBEST_API_KEY: z.string(),
  POLAR_ORGANIZATION_ID: z.string(),
  POLAR_SECRET: z.string(),
  POLAR_ACCESS_TOKEN: z.string(),
  META_ACCESS_TOKEN: z.string(),
  META_AD_ACCOUNT_ID: z.string(),
  SCRAPE_DO_API_KEY: z.string(),
  FIRECRAWL_API_KEY: z.string(),
});
export type Env = z.infer<typeof envSchema>;

export const env: Env = {
  DATABASE_URL: process.env["DATABASE_URL"]!,
  PORT: toInt(process.env["PORT"]) || 3000,
  NODE_ENV: process.env["NODE_ENV"] || "development",
  BASE_URL: process.env["BASE_URL"] || "https://reviewweb.site",
  SITE_NAME: process.env["SITE_NAME"] || "ReviewWeb.site",
  SITE_DESCRIPTION:
    process.env["SITE_DESCRIPTION"] ||
    "ReviewWeb.site is a tool that uses AI to review and analyze URLs for detecting inappropriate content.",
  SITE_KEYWORDS:
    process.env["SITE_KEYWORDS"] ||
    "BoostTogether, advertising cost savings, pooled advertising budgets, group ad campaigns, small business advertising, effective advertising, shared landing page, optimize advertising costs, SMEs, shop owners, startups, indie makers, collective advertising, budget efficiency, marketing collaboration, quảng cáo tiết kiệm chi phí, ngân sách quảng cáo chung, chiến dịch quảng cáo nhóm, quảng cáo cho doanh nghiệp nhỏ, quảng cáo hiệu quả, trang đích chung, tối ưu hóa chi phí quảng cáo, doanh nghiệp vừa và nhỏ, chủ cửa hàng, khởi nghiệp, nhà sáng tạo độc lập, hợp tác tiếp thị.",
  LOCALE: process.env["LOCALE"] || "en",
  TZ: process.env["TZ"] || "Asia/Ho_Chi_Minh",
  // server env
  APP_SECRET: process.env["APP_SECRET"]!,
  GITHUB_CLIENT_ID: process.env["GITHUB_CLIENT_ID"]!,
  GITHUB_CLIENT_SECRET: process.env["GITHUB_CLIENT_SECRET"]!,
  GOOGLE_CLIENT_ID: process.env["GOOGLE_CLIENT_ID"]!,
  GOOGLE_CLIENT_SECRET: process.env["GOOGLE_CLIENT_SECRET"]!,
  REDIS_PREFIX: process.env["REDIS_PREFIX"],
  REDIS_URL: process.env["REDIS_URL"],
  CLOUDFLARE_CDN_PROJECT_NAME: process.env["CLOUDFLARE_CDN_PROJECT_NAME"]!,
  CLOUDFLARE_CDN_ACCESS_KEY: process.env["CLOUDFLARE_CDN_ACCESS_KEY"]!,
  CLOUDFLARE_CDN_SECRET_KEY: process.env["CLOUDFLARE_CDN_SECRET_KEY"]!,
  CLOUDFLARE_CDN_BUCKET_NAME: process.env["CLOUDFLARE_CDN_BUCKET_NAME"]!,
  CLOUDFLARE_CDN_ENDPOINT_URL: process.env["CLOUDFLARE_CDN_ENDPOINT_URL"]!,
  CLOUDFLARE_CDN_BASE_URL: process.env["CLOUDFLARE_CDN_BASE_URL"]!,
  WEBSHAREIO_API_KEY: process.env["WEBSHAREIO_API_KEY"]!,
  PROXY_URL: process.env["PROXY_URL"]!,
  OPENROUTER_KEY: process.env["OPENROUTER_KEY"]!,
  UPFILEBEST_API_KEY: process.env["UPFILEBEST_API_KEY"]!,
  POLAR_ORGANIZATION_ID: process.env["POLAR_ORGANIZATION_ID"]!,
  POLAR_ACCESS_TOKEN: process.env["POLAR_ACCESS_TOKEN"]!,
  POLAR_SECRET: process.env["POLAR_SECRET"]!,
  META_ACCESS_TOKEN: process.env["META_ACCESS_TOKEN"]!,
  META_AD_ACCOUNT_ID: process.env["META_AD_ACCOUNT_ID"]!,
  SCRAPE_DO_API_KEY: process.env["SCRAPE_DO_API_KEY"]!,
  FIRECRAWL_API_KEY: process.env["FIRECRAWL_API_KEY"]!,
};

const {
  DATABASE_URL,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIS_PREFIX,
  REDIS_URL,
  CLOUDFLARE_CDN_PROJECT_NAME,
  CLOUDFLARE_CDN_ACCESS_KEY,
  CLOUDFLARE_CDN_SECRET_KEY,
  CLOUDFLARE_CDN_BUCKET_NAME,
  CLOUDFLARE_CDN_ENDPOINT_URL,
  WEBSHAREIO_API_KEY,
  PROXY_URL,
  OPENROUTER_KEY,
  UPFILEBEST_API_KEY,
  POLAR_ORGANIZATION_ID,
  POLAR_ACCESS_TOKEN,
  POLAR_SECRET,
  META_ACCESS_TOKEN,
  META_AD_ACCOUNT_ID,
  SCRAPE_DO_API_KEY,
  FIRECRAWL_API_KEY,
  ...clientEnv
} = env;

export { clientEnv };
