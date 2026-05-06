import { describe, expect, it } from "vitest";
import { resolveToolName } from "./call-tool.js";

describe("resolveToolName", () => {
  it("maps MCP snake_case tool names to internal handler names", () => {
    expect(resolveToolName("login_taobao")).toBe("loginTaobao");
    expect(resolveToolName("login_jd")).toBe("loginJd");
    expect(resolveToolName("login_cainiao")).toBe("loginCainiao");
    expect(resolveToolName("sync_packages")).toBe("syncPackages");
    expect(resolveToolName("get_my_packages")).toBe("getMyPackages");
    expect(resolveToolName("track_package")).toBe("trackPackage");
    expect(resolveToolName("get_delivered_today")).toBe("getDeliveredToday");
  });

  it("keeps internal handler names working for local debugging", () => {
    expect(resolveToolName("getMyPackages")).toBe("getMyPackages");
  });
});
