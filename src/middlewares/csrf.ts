import { doubleCsrf } from "csrf-csrf";
import type express from "express";

import { env } from "@/env";

const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => env.APP_SECRET, // Bạn cần định nghĩa secret này trong config
  cookieName: "x-csrf-token",
  cookieOptions: {
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
});

// Tạo một wrapper function để xử lý trường hợp không có cookie
const safeGenerateToken = (req: express.Request, res: express.Response) => {
  try {
    return generateToken(req, res);
  } catch (error) {
    console.warn("Failed to generate CSRF token, returning empty string", error);
    return "";
  }
};

export { doubleCsrfProtection, safeGenerateToken as generateToken };
