import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type {
  GetMyPackagesInput,
  PackageSource,
  PackageStore,
  TrackPackageInput
} from "../domain/types.js";
import { PackageService } from "../services/package-service.js";
import type { PackageProvider } from "../providers/provider.js";

export interface ToolHandlerOptions {
  store: PackageStore;
  providers: PackageProvider[];
  now?: () => Date;
  timezone?: string;
}

export interface SyncPackagesInput {
  source?: PackageSource;
}

export function createToolHandlers(options: ToolHandlerOptions) {
  const service = new PackageService(options.store, {
    now: options.now,
    timezone: options.timezone
  });
  const providers = new Map(options.providers.map((provider) => [provider.source, provider]));

  return {
    async loginTaobao(): Promise<CallToolResult> {
      return toToolResult(await requireProvider(providers, "taobao").login());
    },

    async loginJd(): Promise<CallToolResult> {
      return toToolResult(await requireProvider(providers, "jd").login());
    },

    async loginCainiao(): Promise<CallToolResult> {
      return toToolResult(await requireProvider(providers, "cainiao").login());
    },

    async syncPackages(input: SyncPackagesInput): Promise<CallToolResult> {
      const selectedProviders = input.source
        ? [requireProvider(providers, input.source)]
        : [...providers.values()];
      const syncResults = await Promise.all(selectedProviders.map((provider) => provider.syncPackages()));
      const packages = syncResults.flatMap((result) => result.packages);
      await options.store.upsertPackages(packages);

      return toToolResult({
        syncedPackageCount: packages.length,
        providers: syncResults.map((result) => ({
          provider: result.provider,
          packageCount: result.packages.length,
          capturedUrl: result.capturedUrl,
          screenshotPath: result.screenshotPath,
          warnings: result.warnings
        }))
      });
    },

    async getMyPackages(input: GetMyPackagesInput): Promise<CallToolResult> {
      return toToolResult({
        packages: await service.getMyPackages(input)
      });
    },

    async trackPackage(input: TrackPackageInput): Promise<CallToolResult> {
      return toToolResult({
        package: await service.trackPackage(input)
      });
    },

    async getDeliveredToday(input: Record<string, never>): Promise<CallToolResult> {
      return toToolResult({
        packages: await service.getDeliveredToday(input)
      });
    }
  };
}

export type ToolHandlers = ReturnType<typeof createToolHandlers>;

function requireProvider(
  providers: Map<PackageSource, PackageProvider>,
  source: PackageSource
): PackageProvider {
  const provider = providers.get(source);
  if (!provider) {
    throw new Error(`Provider is not configured: ${source}`);
  }

  return provider;
}

function toToolResult(data: unknown): CallToolResult {
  return {
    structuredContent: data as Record<string, unknown>,
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2)
      }
    ]
  };
}
