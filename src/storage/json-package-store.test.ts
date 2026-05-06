import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JsonPackageStore } from "./json-package-store.js";
import type { PackageRecord } from "../domain/types.js";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "package-store-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

const baseRecord: PackageRecord = {
  id: "tb-1",
  source: "taobao",
  title: "Keyboard",
  status: "in_transit",
  trackingNumber: "YT123",
  lastUpdatedAt: "2026-05-06T08:00:00.000+08:00",
  events: []
};

describe("JsonPackageStore", () => {
  it("returns an empty list when the store file does not exist", async () => {
    const store = new JsonPackageStore(join(tempDir, "packages.json"));

    await expect(store.listPackages()).resolves.toEqual([]);
  });

  it("upserts records by id and keeps the newest value", async () => {
    const store = new JsonPackageStore(join(tempDir, "nested", "packages.json"));

    await store.upsertPackages([baseRecord]);
    await store.upsertPackages([
      {
        ...baseRecord,
        title: "Keyboard v2",
        status: "out_for_delivery",
        lastUpdatedAt: "2026-05-06T12:00:00.000+08:00"
      }
    ]);

    const records = await store.listPackages();

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      id: "tb-1",
      title: "Keyboard v2",
      status: "out_for_delivery"
    });
  });

  it("writes pretty JSON for easy inspection", async () => {
    const file = join(tempDir, "packages.json");
    const store = new JsonPackageStore(file);

    await store.upsertPackages([baseRecord]);

    const content = await readFile(file, "utf8");
    expect(content).toContain('\n  "packages": [\n');
  });
});
