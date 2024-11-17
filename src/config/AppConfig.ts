// FIXME: Update this configuration file based on your project information

import { env } from "@/env";

const AppConfig = {
  environment: env.NODE_ENV || "development",
  siteName: env.SITE_NAME || "Boost Together",
  siteDescription:
    env.SITE_DESCRIPTION ||
    "The Power of WE in Advertising - We help businesses save money by pooling ad budgets together and sharing traffic from paid campaigns.",
  locale: env.LOCALE || "en",
  TZ: env.TZ || "Asia/Ho_Chi_Minh",

  get title(): string {
    return AppConfig.siteName;
  },
  description: "Next14 Starter",

  icons: [{ rel: "icon", url: "/favicon.ico" }],

  getBaseUrl: (path = "") => {
    return env.BASE_URL ? `${env.BASE_URL}${path}` : path;
  },

  getAuthCallbackUrl: (provider: string) => {
    return AppConfig.getBaseUrl(`/api/auth/callback${provider}`);
  },

  getCloudflareCDNUrl: (url = "") => {
    return `${env.CLOUDFLARE_CDN_BASE_URL}${url}`;
  },
};

export default AppConfig;
