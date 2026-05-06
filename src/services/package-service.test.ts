import { describe, expect, it } from "vitest";
import { PackageService } from "./package-service.js";
import type { PackageRecord, PackageStore } from "../domain/types.js";

class MemoryStore implements PackageStore {
  constructor(private readonly records: PackageRecord[]) {}

  async listPackages(): Promise<PackageRecord[]> {
    return this.records;
  }

  async upsertPackages(): Promise<void> {
    return;
  }
}

const packages: PackageRecord[] = [
  {
    id: "tb-1",
    source: "taobao",
    title: "Keyboard",
    status: "in_transit",
    trackingNumber: "YT123",
    carrier: "YTO",
    lastEvent: "Arrived at Shanghai sorting center",
    lastUpdatedAt: "2026-05-06T08:00:00.000+08:00",
    events: [
      {
        time: "2026-05-06T08:00:00.000+08:00",
        description: "Arrived at Shanghai sorting center"
      }
    ]
  },
  {
    id: "jd-1",
    source: "jd",
    title: "Coffee beans",
    status: "delivered",
    trackingNumber: "JD123",
    carrier: "JD Logistics",
    lastEvent: "Delivered",
    lastUpdatedAt: "2026-05-06T10:00:00.000+08:00",
    deliveredAt: "2026-05-06T10:00:00.000+08:00",
    events: []
  },
  {
    id: "tb-2",
    source: "taobao",
    title: "Monitor arm",
    status: "delivered",
    trackingNumber: "ZTO123",
    carrier: "ZTO",
    lastEvent: "Delivered yesterday",
    lastUpdatedAt: "2026-05-05T20:00:00.000+08:00",
    deliveredAt: "2026-05-05T20:00:00.000+08:00",
    events: []
  }
];

describe("PackageService", () => {
  it("returns waiting packages by default", async () => {
    const service = new PackageService(new MemoryStore(packages), {
      now: () => new Date("2026-05-06T12:00:00.000+08:00"),
      timezone: "Asia/Shanghai"
    });

    const result = await service.getMyPackages({});

    expect(result.map((record) => record.id)).toEqual(["tb-1"]);
  });

  it("filters packages by source and status", async () => {
    const service = new PackageService(new MemoryStore(packages), {
      now: () => new Date("2026-05-06T12:00:00.000+08:00"),
      timezone: "Asia/Shanghai"
    });

    const result = await service.getMyPackages({
      source: "jd",
      status: "delivered",
      includeDelivered: true
    });

    expect(result.map((record) => record.id)).toEqual(["jd-1"]);
  });

  it("tracks a package by tracking number", async () => {
    const service = new PackageService(new MemoryStore(packages), {
      now: () => new Date("2026-05-06T12:00:00.000+08:00"),
      timezone: "Asia/Shanghai"
    });

    const result = await service.trackPackage({ trackingNumber: "yt123" });

    expect(result.id).toBe("tb-1");
    expect(result.lastEvent).toBe("Arrived at Shanghai sorting center");
  });

  it("returns packages delivered today in the configured timezone", async () => {
    const service = new PackageService(new MemoryStore(packages), {
      now: () => new Date("2026-05-06T12:00:00.000+08:00"),
      timezone: "Asia/Shanghai"
    });

    const result = await service.getDeliveredToday({});

    expect(result.map((record) => record.id)).toEqual(["jd-1"]);
  });

  it("throws when tracking input does not match a package", async () => {
    const service = new PackageService(new MemoryStore(packages), {
      now: () => new Date("2026-05-06T12:00:00.000+08:00"),
      timezone: "Asia/Shanghai"
    });

    await expect(service.trackPackage({ trackingNumber: "missing" })).rejects.toThrow(
      "Package not found"
    );
  });
});
