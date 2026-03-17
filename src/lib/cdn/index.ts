import { toBool } from "diginext-utils/dist/object";

export const isCdnStorageAvaiable = () => {
  return (
    toBool(process.env.CLOUDFLARE_CDN_ACCESS_KEY) && toBool(process.env.CLOUDFLARE_CDN_SECRET_KEY)
  );
};
