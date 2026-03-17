import axios from "axios";
import { HttpProxyAgent } from "http-proxy-agent";
import { z } from "zod";

export const PlaywightProxySchema = z.object({
  server: z.string().min(1).describe("The proxy server URL. Example: `http://host:port`"),
  username: z.string().min(1),
  password: z.string().min(1),
});
export type PlaywightProxy = z.infer<typeof PlaywightProxySchema>;

const AxiosProxySchema = z.object({
  host: z.string().min(1),
  port: z.number().int().positive(),
  auth: z.object({
    username: z.string().min(1),
    password: z.string().min(1),
  }),
  bypass: z.string().optional(),
});
export type AxiosProxy = z.infer<typeof AxiosProxySchema>;

/**
 * Convert a proxy URL to an Axios proxy object
 * @param url - The proxy URL. Example: `http://user:pass@host:port`
 * @returns The Axios proxy object
 */
export function proxyUrlToAxiosProxy(url: string): AxiosProxy {
  try {
    // Updated URL pattern to include authentication
    const urlPattern = /^(https?:\/\/)?(?:([^:@\s]+):([^:@\s]+)@)?([^:/\s]+)(?::(\d+))?(?:\/.*)?$/;
    const match = url.match(urlPattern);
    if (!match) throw new Error("Invalid URL format");

    const [, protocol, username, password, host, portString] = match;

    // Parse port, defaulting to 80 for http and 443 for https if not provided
    let port: number;
    if (portString) {
      port = parseInt(portString, 10);
      if (isNaN(port)) throw new Error("Invalid port number");
    } else {
      port = protocol === "https:" ? 443 : 80;
    }

    const proxyData = {
      host,
      port,
      auth: {
        username: username || "",
        password: password || "",
      },
    };

    // console.log("proxy-utils.ts > proxyUrlToAxiosProxy() > proxyData :>>", proxyData);

    // Validate the proxy data
    AxiosProxySchema.parse(proxyData);

    return proxyData;
  } catch (error) {
    console.error("proxy-utils.ts > proxyUrlToAxiosProxy() > error :>>", error);
    throw new Error("Failed to convert proxy URL to Axios proxy");
  }
}

/**
 * Convert a proxy URL to a Playwright proxy object
 * @param url - The proxy URL. Example: `http://user:pass@host:port`
 * @returns The Playwright proxy object
 */
export function proxyUrlToPlaywightProxy(url: string): PlaywightProxy {
  console.log("proxyUrlToPlaywightProxy :>>", url);
  const axiosProxy = proxyUrlToAxiosProxy(url);
  const protocol = url.startsWith("https") ? "https" : "http"; // Determine protocol based on the input URL
  return {
    server: `${protocol}://${axiosProxy.host}:${axiosProxy.port}`, // Removed auth from server
    username: axiosProxy.auth.username,
    password: axiosProxy.auth.password,
  };
}

export async function testProxyConnection(
  proxyServer: string,
  username: string,
  password: string
): Promise<boolean> {
  // console.log("proxy-utils.ts > testProxyConnection() > Starting proxy connection test");

  try {
    // Construct the proxy URL with authentication
    const proxyUrl = new URL(proxyServer);
    proxyUrl.username = encodeURIComponent(username);
    proxyUrl.password = encodeURIComponent(password);

    // Create a proxy agent
    const agent = new HttpProxyAgent(proxyUrl.toString());

    // Make a test request
    const response = await axios.get("http://example.com", {
      httpAgent: agent,
      timeout: 5000, // 5 second timeout
    });

    if (response.status === 200) {
      // console.log("proxy-utils.ts > testProxyConnection() > Proxy connection successful");
      return true;
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    console.error("proxy-utils.ts > testProxyConnection() > error :>>", error);
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        console.error("Proxy connection timed out");
      } else if (error.response) {
        console.error(`Proxy connection failed with status ${error.response.status}`);
      } else if (error.request) {
        console.error("No response received from proxy server");
      }
    }
    console.error("Failed to connect to proxy server");
  }
  return false;
}
