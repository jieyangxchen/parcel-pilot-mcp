import { describe, expect, it } from "vitest";
import { createToolHandlers } from "./tool-handlers.js";
import type { PackageRecord, PackageStore } from "../domain/types.js";
import type { PackageProvider, ProviderLoginResult, ProviderSyncResult } from "../providers/provider.js";

class MemoryStore implements PackageStore {
  public records: PackageRecord[] = [];

  async listPackages(): Promise<PackageRecord[]> {
    return this.records;
  }

  async upsertPackages(records: PackageRecord[]): Promise<void> {
    const byId = new Map(this.records.map((record) => [record.id, record]));
    for (const record of records) {
      byId.set(record.id, record);
    }
    this.records = [...byId.values()];
  }
}

class FakeProvider implements PackageProvider {
  constructor(
    readonly source: "taobao" | "jd" | "cainiao",
    private readonly packages: PackageRecord[]
  ) {}

  async login(): Promise<ProviderLoginResult> {
    return {
      provider: this.source,
      status: "manual_action_required",
      loginUrl: `https://${this.source}.example/login`,
      screenshotPath: `/tmp/${this.source}.png`,
      message: "scan qr"
    };
  }

  async syncPackages(): Promise<ProviderSyncResult> {
    return {
      provider: this.source,
      packages: this.packages,
      capturedUrl: `https://${this.source}.example/packages`,
      screenshotPath: `/tmp/${this.source}-sync.png`,
      warnings: []
    };
  }
}

const taobaoPackage: PackageRecord = {
  id: "tb-1",
  source: "taobao",
  title: "Keyboard",
  status: "in_transit",
  trackingNumber: "YT123",
  lastUpdatedAt: "2026-05-06T08:00:00.000+08:00",
  events: []
};

const jdPackage: PackageRecord = {
  id: "jd-1",
  source: "jd",
  title: "Coffee",
  status: "delivered",
  trackingNumber: "JD123",
  lastUpdatedAt: "2026-05-06T10:00:00.000+08:00",
  deliveredAt: "2026-05-06T10:00:00.000+08:00",
  events: []
};

describe("createToolHandlers", () => {
  it("logs in to Taobao", async () => {
    const handlers = createToolHandlers({
      store: new MemoryStore(),
      providers: [new FakeProvider("taobao", [taobaoPackage])]
    });

    const result = await handlers.loginTaobao();

    expect(result.structuredContent).toMatchObject({
      provider: "taobao",
      screenshotPath: "/tmp/taobao.png"
    });
  });

  it("logs in to Cainiao", async () => {
    const handlers = createToolHandlers({
      store: new MemoryStore(),
      providers: [new FakeProvider("cainiao", [])]
    });

    const result = await handlers.loginCainiao();

    expect(result.structuredContent).toMatchObject({
      provider: "cainiao",
      screenshotPath: "/tmp/cainiao.png"
    });
  });

  it("syncs all providers and stores packages", async () => {
    const store = new MemoryStore();
    const handlers = createToolHandlers({
      store,
      providers: [new FakeProvider("taobao", [taobaoPackage]), new FakeProvider("jd", [jdPackage])]
    });

    const result = await handlers.syncPackages({});

    expect(result.structuredContent).toMatchObject({
      syncedPackageCount: 2
    });
    expect(store.records.map((record) => record.id).sort()).toEqual(["jd-1", "tb-1"]);
  });

  it("returns active packages through get_my_packages", async () => {
    const store = new MemoryStore();
    await store.upsertPackages([taobaoPackage, jdPackage]);
    const handlers = createToolHandlers({
      store,
      providers: []
    });

    const result = await handlers.getMyPackages({});

    expect(result.structuredContent).toMatchObject({
      packages: [taobaoPackage]
    });
  });

  it("tracks a package by tracking number", async () => {
    const store = new MemoryStore();
    await store.upsertPackages([taobaoPackage]);
    const handlers = createToolHandlers({
      store,
      providers: []
    });

    const result = await handlers.trackPackage({ trackingNumber: "YT123" });

    expect(result.structuredContent).toMatchObject({
      package: taobaoPackage
    });
  });

  it("returns packages delivered today", async () => {
    const store = new MemoryStore();
    await store.upsertPackages([taobaoPackage, jdPackage]);
    const handlers = createToolHandlers({
      store,
      providers: [],
      now: () => new Date("2026-05-06T12:00:00.000+08:00"),
      timezone: "Asia/Shanghai"
    });

    const result = await handlers.getDeliveredToday({});

    expect(result.structuredContent).toMatchObject({
      packages: [jdPackage]
    });
  });
});
