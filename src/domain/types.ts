export type PackageSource = "taobao" | "jd" | "cainiao";

export type PackageStatus =
  | "pending_shipment"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "exception"
  | "unknown";

export interface PackageEvent {
  time?: string;
  description: string;
  location?: string;
}

export interface PackageRecord {
  id: string;
  source: PackageSource;
  title: string;
  status: PackageStatus;
  trackingNumber?: string;
  carrier?: string;
  orderId?: string;
  packageUrl?: string;
  lastEvent?: string;
  lastUpdatedAt?: string;
  deliveredAt?: string;
  eta?: string;
  raw?: unknown;
  events: PackageEvent[];
}

export interface PackageStore {
  listPackages(): Promise<PackageRecord[]>;
  upsertPackages(records: PackageRecord[]): Promise<void>;
}

export interface GetMyPackagesInput {
  source?: PackageSource;
  status?: PackageStatus;
  includeDelivered?: boolean;
}

export interface TrackPackageInput {
  packageId?: string;
  trackingNumber?: string;
}

export interface GetDeliveredTodayInput {
  date?: Date;
}
