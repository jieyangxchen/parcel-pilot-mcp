import { join } from "node:path";
import type { BrowserSession } from "../browser/browser-session-manager.js";
import { parsePackageCards } from "./html-parsing.js";
import type { PackageProvider, ProviderLoginResult, ProviderSyncResult } from "./provider.js";

const TAOBAO_LOGIN_URL = "https://login.taobao.com/member/login.jhtml";
const TAOBAO_PACKAGES_URL = "https://buyertrade.taobao.com/trade/itemlist/list_bought_items.htm";

export interface ProviderOptions {
  artifactDir: string;
  now?: () => Date;
}

export class TaobaoProvider implements PackageProvider {
  readonly source = "taobao" as const;

  constructor(
    private readonly session: BrowserSession,
    private readonly options: ProviderOptions
  ) {}

  async login(): Promise<ProviderLoginResult> {
    const screenshotPath = join(this.options.artifactDir, "login", "taobao-login.png");
    const capture = await this.session.capturePage(TAOBAO_LOGIN_URL, screenshotPath);

    return {
      provider: this.source,
      status: "manual_action_required",
      loginUrl: capture.url,
      screenshotPath: capture.screenshotPath,
      message:
        "Open the screenshot and scan the Taobao QR code. If Taobao asks for captcha or device verification, complete it manually in the browser session."
    };
  }

  async syncPackages(): Promise<ProviderSyncResult> {
    const screenshotPath = join(this.options.artifactDir, "sync", "taobao-packages.png");
    const capture = await this.session.capturePage(TAOBAO_PACKAGES_URL, screenshotPath);
    const packages = parsePackageCards(capture.html, this.source);

    return {
      provider: this.source,
      packages,
      capturedUrl: capture.url,
      screenshotPath: capture.screenshotPath,
      warnings: packages.length === 0 ? ["No Taobao package cards were parsed. Login may be expired or selectors may need updating."] : []
    };
  }
}
