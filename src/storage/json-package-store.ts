import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { PackageRecord, PackageStore } from "../domain/types.js";

interface PackageStoreFile {
  packages: PackageRecord[];
}

export class JsonPackageStore implements PackageStore {
  constructor(private readonly filePath: string) {}

  async listPackages(): Promise<PackageRecord[]> {
    try {
      const content = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(content) as Partial<PackageStoreFile>;
      return Array.isArray(parsed.packages) ? parsed.packages : [];
    } catch (error) {
      if (isNotFound(error)) {
        return [];
      }

      throw error;
    }
  }

  async upsertPackages(records: PackageRecord[]): Promise<void> {
    const existing = await this.listPackages();
    const byId = new Map(existing.map((record) => [record.id, record]));

    for (const record of records) {
      byId.set(record.id, record);
    }

    const next: PackageStoreFile = {
      packages: [...byId.values()].sort((left, right) => left.id.localeCompare(right.id))
    };

    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  }
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}
