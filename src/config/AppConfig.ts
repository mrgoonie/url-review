// FIXME: Update this configuration file based on your project information

import { env } from "@/env";

const AppConfig = {
  environment: env.NODE_ENV || "development",
  siteName: env.SITE_NAME || "ReviewWeb.site",
  siteDescription:
    env.SITE_DESCRIPTION ||
    "ReviewWeb.site is a tool that uses AI to review and analyze URLs for detecting inappropriate content.",
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
