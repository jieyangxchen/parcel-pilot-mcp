import { join } from "node:path";
import type { BrowserSession } from "../browser/browser-session-manager.js";
import { parsePackageCards } from "./html-parsing.js";
import type { PackageProvider, ProviderLoginResult, ProviderSyncResult } from "./provider.js";

const JD_LOGIN_URL = "https://passport.jd.com/new/login.aspx";
const JD_PACKAGES_URL = "https://order.jd.com/center/list.action";

export interface ProviderOptions {
  artifactDir: string;
  now?: () => Date;
}

export class JdProvider implements PackageProvider {
  readonly source = "jd" as const;

  constructor(
    private readonly session: BrowserSession,
    private readonly options: ProviderOptions
  ) {}

  async login(): Promise<ProviderLoginResult> {
    const screenshotPath = join(this.options.artifactDir, "login", "jd-login.png");
    const capture = await this.session.capturePage(JD_LOGIN_URL, screenshotPath);

    return {
      provider: this.source,
      status: "manual_action_required",
      loginUrl: capture.url,
      screenshotPath: capture.screenshotPath,
      message:
        "Open the screenshot and scan the JD QR code. If JD asks for captcha or device verification, complete it manually in the browser session."
    };
  }

  async syncPackages(): Promise<ProviderSyncResult> {
    const screenshotPath = join(this.options.artifactDir, "sync", "jd-packages.png");
    const capture = await this.session.capturePage(JD_PACKAGES_URL, screenshotPath);
    const packages = parsePackageCards(capture.html, this.source);

    return {
      provider: this.source,
      packages,
      capturedUrl: capture.url,
      screenshotPath: capture.screenshotPath,
      warnings: packages.length === 0 ? ["No JD package cards were parsed. Login may be expired or selectors may need updating."] : []
    };
  }
}
