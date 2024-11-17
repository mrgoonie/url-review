/**
 * Extract code from between backticks
 */
export function extractTextBetweenBackticks(input: string) {
  const regex = /```(.*?)```/s;
  const match = input.match(regex);
  return match && match[1] ? match[1].trim() : input;
}
