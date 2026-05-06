import type { PackageRecord, PackageSource } from "../domain/types.js";

export type ProviderLoginStatus = "manual_action_required" | "already_logged_in";

export interface ProviderLoginResult {
  provider: PackageSource;
  status: ProviderLoginStatus;
  loginUrl: string;
  screenshotPath: string;
  message: string;
}

export interface ProviderSyncResult {
  provider: PackageSource;
  packages: PackageRecord[];
  capturedUrl: string;
  screenshotPath: string;
  warnings: string[];
}

export interface PackageProvider {
  readonly source: PackageSource;
  login(): Promise<ProviderLoginResult>;
  syncPackages(): Promise<ProviderSyncResult>;
}
