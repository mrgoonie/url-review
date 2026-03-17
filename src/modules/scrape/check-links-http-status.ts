export async function getHttpStatusCode(url: string) {
  try {
    const response = await fetch(url);
    return response.status;
  } catch (error: any) {
    // console.error("getHttpStatusCode() > Error:", error);
    if (error.toString().includes("ConnectTimeoutError")) return 504;
    return null;
  }
}

export async function getHttpStatusCodeAll(urls: string[]) {
  try {
    const statusCodes = await Promise.all(urls.map((url) => getHttpStatusCode(url)));
    return statusCodes;
  } catch (error: any) {
    // console.error("getHttpStatusCodeAll() > Error:", error);
    return null;
  }
}
