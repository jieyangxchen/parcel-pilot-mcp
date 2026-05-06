import type {
  GetDeliveredTodayInput,
  GetMyPackagesInput,
  PackageRecord,
  PackageStatus,
  PackageStore,
  TrackPackageInput
} from "../domain/types.js";

const ACTIVE_STATUSES: PackageStatus[] = [
  "pending_shipment",
  "in_transit",
  "out_for_delivery",
  "exception",
  "unknown"
];

export interface PackageServiceOptions {
  now?: () => Date;
  timezone?: string;
}

export class PackageService {
  private readonly now: () => Date;
  private readonly timezone: string;

  constructor(
    private readonly store: PackageStore,
    options: PackageServiceOptions = {}
  ) {
    this.now = options.now ?? (() => new Date());
    this.timezone = options.timezone ?? "Asia/Shanghai";
  }

  async getMyPackages(input: GetMyPackagesInput): Promise<PackageRecord[]> {
    const records = await this.store.listPackages();

    return records
      .filter((record) => {
        if (input.source && record.source !== input.source) {
          return false;
        }

        if (input.status && record.status !== input.status) {
          return false;
        }

        if (!input.status && !input.includeDelivered && !ACTIVE_STATUSES.includes(record.status)) {
          return false;
        }

        return true;
      })
      .sort(sortNewestFirst);
  }

  async trackPackage(input: TrackPackageInput): Promise<PackageRecord> {
    if (!input.packageId && !input.trackingNumber) {
      throw new Error("Either packageId or trackingNumber is required");
    }

    const trackingNumber = input.trackingNumber?.toLowerCase();
    const records = await this.store.listPackages();
    const match = records.find((record) => {
      if (input.packageId && record.id === input.packageId) {
        return true;
      }

      return trackingNumber !== undefined && record.trackingNumber?.toLowerCase() === trackingNumber;
    });

    if (!match) {
      throw new Error("Package not found");
    }

    return match;
  }

  async getDeliveredToday(input: GetDeliveredTodayInput): Promise<PackageRecord[]> {
    const records = await this.store.listPackages();
    const targetDate = dateKey(input.date ?? this.now(), this.timezone);

    return records
      .filter((record) => {
        if (record.status !== "delivered" || !record.deliveredAt) {
          return false;
        }

        return dateKey(new Date(record.deliveredAt), this.timezone) === targetDate;
      })
      .sort(sortNewestFirst);
  }
}

function sortNewestFirst(left: PackageRecord, right: PackageRecord): number {
  const leftTime = Date.parse(left.lastUpdatedAt ?? left.deliveredAt ?? "1970-01-01T00:00:00.000Z");
  const rightTime = Date.parse(right.lastUpdatedAt ?? right.deliveredAt ?? "1970-01-01T00:00:00.000Z");
  return rightTime - leftTime;
}

function dateKey(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error(`Unable to format date for timezone ${timezone}`);
  }

  return `${year}-${month}-${day}`;
}
