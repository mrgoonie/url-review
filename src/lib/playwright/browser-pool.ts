import type { Browser } from "playwright";
import { chromium, firefox } from "playwright";

class BrowserPool {
  private firefoxBrowser: Browser | null = null;
  private chromiumBrowser: Browser | null = null;

  async initialize() {
    this.firefoxBrowser = await firefox.launch({ headless: true });
    this.chromiumBrowser = await chromium.launch({ headless: true });
    console.log("✅ Browser pool initialized");
  }

  async getBrowser(type: "firefox" | "chromium"): Promise<Browser> {
    if (type === "firefox") {
      if (!this.firefoxBrowser) {
        this.firefoxBrowser = await firefox.launch({ headless: true });
      }
      return this.firefoxBrowser;
    } else {
      if (!this.chromiumBrowser) {
        this.chromiumBrowser = await chromium.launch({ headless: true });
      }
      return this.chromiumBrowser;
    }
  }

  async closeBrowsers() {
    if (this.firefoxBrowser) await this.firefoxBrowser.close();
    if (this.chromiumBrowser) await this.chromiumBrowser.close();
    console.log("✅ Browser pool closed");
  }
}

export const browserPool = new BrowserPool();
