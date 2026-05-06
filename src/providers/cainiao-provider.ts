import { join } from "node:path";
import type { BrowserSession } from "../browser/browser-session-manager.js";
import { parsePackageCards } from "./html-parsing.js";
import type { PackageProvider, ProviderLoginResult, ProviderSyncResult } from "./provider.js";

const CAINIAO_LOGIN_URL = "https://www.cainiao.com/";
const CAINIAO_PACKAGES_URL = "https://www.cainiao.com/";

export interface ProviderOptions {
  artifactDir: string;
  now?: () => Date;
}

export class CainiaoProvider implements PackageProvider {
  readonly source = "cainiao" as const;

  constructor(
    private readonly session: BrowserSession,
    private readonly options: ProviderOptions
  ) {}

  async login(): Promise<ProviderLoginResult> {
    const screenshotPath = join(this.options.artifactDir, "login", "cainiao-login.png");
    const capture = await this.session.capturePage(CAINIAO_LOGIN_URL, screenshotPath);

    return {
      provider: this.source,
      status: "manual_action_required",
      loginUrl: capture.url,
      screenshotPath: capture.screenshotPath,
      message:
        "Open the screenshot and sign in to Cainiao. If the page asks for Taobao/Alipay QR login, scan it and complete any manual verification."
    };
  }

  async syncPackages(): Promise<ProviderSyncResult> {
    const screenshotPath = join(this.options.artifactDir, "sync", "cainiao-packages.png");
    const capture = await this.session.capturePage(CAINIAO_PACKAGES_URL, screenshotPath);
    const packages = parsePackageCards(capture.html, this.source);

    return {
      provider: this.source,
      packages,
      capturedUrl: capture.url,
      screenshotPath: capture.screenshotPath,
      warnings: packages.length === 0 ? ["No Cainiao package cards were parsed. Login may be expired or selectors may need updating."] : []
    };
  }
}
