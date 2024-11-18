import AppConfig from "@/config/AppConfig";

export const Environment = {
  PRODUCTION: "production",
  STAGING: "staging",
  DEVELOPMENT: "development",
  CANARY: "canary",
  LOCAL: "local",
};

export const IsDev = () => {
  return AppConfig.environment === Environment.DEVELOPMENT;
};

export const IsStag = () => {
  return AppConfig.environment === Environment.STAGING;
};

export const IsProd = () => {
  return AppConfig.environment === Environment.PRODUCTION;
};

export const IsCanary = () => {
  return AppConfig.environment === Environment.CANARY;
};

export const IsLocal = () => {
  return AppConfig.environment === Environment.LOCAL;
};
