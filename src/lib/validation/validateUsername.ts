export default function validateUsername(username: any): { error?: string } {
  const MIN_USERNAME_LENGTH = 3;
  const MAX_USERNAME_LENGTH = 31;
  const USERNAME_REGEX = /^[a-z0-9_-]+$/;

  if (
    typeof username !== "string" ||
    username.length < MIN_USERNAME_LENGTH ||
    username.length > MAX_USERNAME_LENGTH ||
    !USERNAME_REGEX.test(username)
  ) {
    return {
      error:
        "Invalid username. Must be 3-31 characters and include only lowercase letters, numbers, hyphens, and underscores.",
    };
  }

  // Additional username checks can be placed here (e.g., reserved names, patterns)

  return {};
}
