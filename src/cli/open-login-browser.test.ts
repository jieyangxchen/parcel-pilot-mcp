import { describe, expect, it } from "vitest";
import { getProviderLoginUrl } from "./open-login-browser.js";

describe("getProviderLoginUrl", () => {
  it("returns login URLs for supported providers", () => {
    expect(getProviderLoginUrl("taobao")).toContain("taobao.com");
    expect(getProviderLoginUrl("jd")).toContain("jd.com");
    expect(getProviderLoginUrl("cainiao")).toContain("cainiao.com");
  });

  it("rejects unsupported providers", () => {
    expect(() => getProviderLoginUrl("missing")).toThrow("Unsupported provider");
  });
});
