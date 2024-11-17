import axios from "axios";

import { env } from "@/env";

export type Proxy = {
  id: string;
  username: string;
  password: string;
  proxy_address: string;
  port: number;
  valid: boolean;
};

export const proxies: Proxy[] = [];

const WEBSHARE_BASE_URL = `https://proxy.webshare.io`;
const WEBSHARE_API_PATH = `/api/v2/proxy/list/?mode=direct&page=1&page_size=100`;

export async function fetchWebshare() {
  try {
    const headers = { Authorization: `Token ${env.WEBSHAREIO_API_KEY}` };
    const response = await axios.get(`${WEBSHARE_BASE_URL}${WEBSHARE_API_PATH}`, { headers });
    return response.data.results.filter((proxy: Proxy) => proxy.valid);
  } catch (e) {
    console.error(`Unable to get proxy list from webshare.io:`, e);
    return [];
  }
}

export async function initWebshareProxy() {
  const list = await fetchWebshare();
  console.log("[SYSTEM] Current available proxies: ", list.length);
  proxies.push(...list);
}
