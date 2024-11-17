import { JWT } from "google-auth-library";

import { env } from "@/env";

let cachedClient: JWT | null = null;

export async function getGoogleAccessToken(): Promise<string> {
  if (
    cachedClient &&
    cachedClient.credentials.access_token &&
    cachedClient.credentials.expiry_date &&
    cachedClient.credentials.expiry_date > Date.now()
  ) {
    return cachedClient.credentials.access_token;
  }

  // const keyFilePath = path.join(process.cwd(), 'path-to-your-service-account-key.json');
  if (!env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS)
    throw new Error("Missing Google Service Account Credentials.");
  const keyFile = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);

  const client = new JWT({
    email: keyFile.client_email,
    key: keyFile.private_key,
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });

  await client.authorize();

  if (!client.credentials.access_token) {
    throw new Error("Failed to obtain access token");
  }

  cachedClient = client;
  return client.credentials.access_token;
}
