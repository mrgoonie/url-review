import { env } from "@/env";

export const configureUpfileBest = () => {
  //
  const requiredVars = ["UPFILE_BEST_API_KEY"];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required UPFILE_BEST env variables: ${missingVars.join(", ")}. Please, set them in your .env file.`
    );
  }
};

export const getApiUpfileBestUrl = (url = "") => {
  return `${env.UPFILE_BEST_URL}${url}`;
};
