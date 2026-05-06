import { describe, expect, it } from "vitest";
import { CainiaoProvider } from "./cainiao-provider.js";
import { JdProvider } from "./jd-provider.js";
import { TaobaoProvider } from "./taobao-provider.js";
import type { BrowserSession, PageCapture } from "../browser/browser-session-manager.js";

class FakeBrowserSession implements BrowserSession {
  public readonly captures: Array<{ url: string; screenshotPath: string }> = [];

  constructor(private readonly html: string = "<html></html>") {}

  async capturePage(url: string, screenshotPath: string): Promise<PageCapture> {
    this.captures.push({ url, screenshotPath });
    return {
      url,
      title: "fake page",
      screenshotPath,
      html: this.html
    };
  }
}

describe("TaobaoProvider", () => {
  it("returns a manual QR login instruction with a screenshot path", async () => {
    const session = new FakeBrowserSession();
    const provider = new TaobaoProvider(session, {
      artifactDir: "/tmp/artifacts",
      now: () => new Date("2026-05-06T08:00:00.000+08:00")
    });

    const result = await provider.login();

    expect(result).toMatchObject({
      provider: "taobao",
      status: "manual_action_required",
      screenshotPath: "/tmp/artifacts/login/taobao-login.png"
    });
    expect(session.captures[0].url).toContain("login.taobao.com");
  });

  it("syncs Taobao packages from captured HTML", async () => {
    const session = new FakeBrowserSession(`
      <article data-package-card data-id="tb-1001">
        <h3 data-title>Keyboard</h3>
        <span data-status>运输中</span>
        <span data-tracking-number>YT123</span>
      </article>
    `);
    const provider = new TaobaoProvider(session, { artifactDir: "/tmp/artifacts" });

    const result = await provider.syncPackages();

    expect(result.packages).toHaveLength(1);
    expect(result.packages[0]).toMatchObject({
      id: "tb-1001",
      source: "taobao",
      trackingNumber: "YT123"
    });
  });
});

describe("JdProvider", () => {
  it("returns a manual QR login instruction with a screenshot path", async () => {
    const session = new FakeBrowserSession();
    const provider = new JdProvider(session, {
      artifactDir: "/tmp/artifacts",
      now: () => new Date("2026-05-06T08:00:00.000+08:00")
    });

    const result = await provider.login();

    expect(result).toMatchObject({
      provider: "jd",
      status: "manual_action_required",
      screenshotPath: "/tmp/artifacts/login/jd-login.png"
    });
    expect(session.captures[0].url).toContain("passport.jd.com");
  });

  it("syncs JD packages from captured HTML", async () => {
    const session = new FakeBrowserSession(`
      <section class="package-card" data-id="jd-2001">
        <div class="package-title">Coffee beans</div>
        <div class="package-status">派送中</div>
        <div class="tracking-number">JD123</div>
      </section>
    `);
    const provider = new JdProvider(session, { artifactDir: "/tmp/artifacts" });

    const result = await provider.syncPackages();

    expect(result.packages).toHaveLength(1);
    expect(result.packages[0]).toMatchObject({
      id: "jd-2001",
      source: "jd",
      status: "out_for_delivery",
      trackingNumber: "JD123"
    });
  });
});

describe("CainiaoProvider", () => {
  it("returns a manual QR login instruction with a screenshot path", async () => {
    const session = new FakeBrowserSession();
    const provider = new CainiaoProvider(session, {
      artifactDir: "/tmp/artifacts",
      now: () => new Date("2026-05-06T08:00:00.000+08:00")
    });

    const result = await provider.login();

    expect(result).toMatchObject({
      provider: "cainiao",
      status: "manual_action_required",
      screenshotPath: "/tmp/artifacts/login/cainiao-login.png"
    });
    expect(session.captures[0].url).toContain("cainiao.com");
  });

  it("syncs Cainiao packages from captured HTML", async () => {
    const session = new FakeBrowserSession(`
      <section class="parcel-card" data-id="cn-3001">
        <div class="parcel-title">Book</div>
        <div class="parcel-status">已揽收</div>
        <div class="tracking-number">CN123</div>
      </section>
    `);
    const provider = new CainiaoProvider(session, { artifactDir: "/tmp/artifacts" });

    const result = await provider.syncPackages();

    expect(result.packages).toHaveLength(1);
    expect(result.packages[0]).toMatchObject({
      id: "cn-3001",
      source: "cainiao",
      status: "in_transit",
      trackingNumber: "CN123"
    });
  });
});
