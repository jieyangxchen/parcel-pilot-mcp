import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { chromium, type BrowserContext } from "playwright";
import type { PackageSource } from "../domain/types.js";

export interface PageCapture {
  url: string;
  title: string;
  screenshotPath: string;
  html: string;
}

export interface BrowserSession {
  capturePage(url: string, screenshotPath: string): Promise<PageCapture>;
  close?(): Promise<void>;
}

export interface BrowserSessionManagerOptions {
  profileRoot: string;
  headless: boolean;
  navigationTimeoutMs?: number;
}

export class BrowserSessionManager {
  private readonly sessions = new Map<PackageSource, PlaywrightBrowserSession>();

  constructor(private readonly options: BrowserSessionManagerOptions) {}

  getSession(source: PackageSource): BrowserSession {
    const existing = this.sessions.get(source);
    if (existing) {
      return existing;
    }

    const session = new PlaywrightBrowserSession({
      profileDir: join(this.options.profileRoot, source),
      headless: this.options.headless,
      navigationTimeoutMs: this.options.navigationTimeoutMs
    });
    this.sessions.set(source, session);
    return session;
  }

  async close(): Promise<void> {
    await Promise.all([...this.sessions.values()].map((session) => session.close()));
    this.sessions.clear();
  }
}

interface PlaywrightBrowserSessionOptions {
  profileDir: string;
  headless: boolean;
  navigationTimeoutMs?: number;
}

class PlaywrightBrowserSession implements BrowserSession {
  private context?: BrowserContext;

  constructor(private readonly options: PlaywrightBrowserSessionOptions) {}

  async capturePage(url: string, screenshotPath: string): Promise<PageCapture> {
    const context = await this.getContext();
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(this.options.navigationTimeoutMs ?? 60_000);

    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      await mkdir(dirname(screenshotPath), { recursive: true });
      await page.screenshot({ path: screenshotPath, fullPage: true });

      return {
        url: page.url(),
        title: await page.title(),
        screenshotPath,
        html: await page.content()
      };
    } finally {
      await page.close();
    }
  }

  async close(): Promise<void> {
    await this.context?.close();
    this.context = undefined;
  }

  private async getContext(): Promise<BrowserContext> {
    if (this.context) {
      return this.context;
    }

    await mkdir(this.options.profileDir, { recursive: true });
    this.context = await chromium.launchPersistentContext(this.options.profileDir, {
      headless: this.options.headless,
      viewport: { width: 1366, height: 900 },
      locale: "zh-CN",
      timezoneId: "Asia/Shanghai",
      args: ["--disable-blink-features=AutomationControlled"]
    });

    return this.context;
  }
}
