import { IsLocal } from "@/config";

export default function validatePassword(password: any): { error?: string } {
  if (IsLocal()) return {};

  const MIN_PASSWORD_LENGTH = 8;
  const MAX_PASSWORD_LENGTH = 255;
  // Consider using stronger criteria for password complexity in production
  const PASSWORD_REGEX = /(?=.*\d)(?=.*[a-z])/;
  // (?=.*[A-Z])
  // (?=.*\W)

  if (
    typeof password !== "string" ||
    password.length < MIN_PASSWORD_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH ||
    !PASSWORD_REGEX.test(password)
  ) {
    return {
      error: "Invalid password. Must be 8-255 characters long, include letters and numbers.",
    };
  }

  // Additional password checks can be placed here (e.g., common passwords, patterns)

  return {};
}
