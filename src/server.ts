#!/usr/bin/env node
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadConfig, type AppConfig } from "./config.js";
import { BrowserSessionManager } from "./browser/browser-session-manager.js";
import { JsonPackageStore } from "./storage/json-package-store.js";
import { createToolHandlers } from "./mcp/tool-handlers.js";
import { CainiaoProvider } from "./providers/cainiao-provider.js";
import { JdProvider } from "./providers/jd-provider.js";
import { TaobaoProvider } from "./providers/taobao-provider.js";

const sourceSchema = z.enum(["taobao", "jd", "cainiao"]);
const statusSchema = z.enum([
  "pending_shipment",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "exception",
  "unknown"
]);

export interface BuiltServer {
  server: McpServer;
  close(): Promise<void>;
}

export function buildServer(config: AppConfig = loadConfig()): BuiltServer {
  const browserSessions = new BrowserSessionManager({
    profileRoot: config.profileDir,
    headless: config.headless
  });
  const store = new JsonPackageStore(join(config.dataDir, "packages.json"));
  const artifactDir = config.artifactDir;
  const handlers = createToolHandlers({
    store,
    timezone: config.timezone,
    providers: [
      new TaobaoProvider(browserSessions.getSession("taobao"), { artifactDir }),
      new JdProvider(browserSessions.getSession("jd"), { artifactDir }),
      new CainiaoProvider(browserSessions.getSession("cainiao"), { artifactDir })
    ]
  });

  const server = new McpServer({
    name: "parcel-pilot-mcp",
    version: "0.1.0"
  });

  server.registerTool(
    "login_taobao",
    {
      title: "Login Taobao",
      description: "Open the Taobao login page in a persistent browser session and return a QR screenshot path."
    },
    async () => handlers.loginTaobao()
  );

  server.registerTool(
    "login_jd",
    {
      title: "Login JD",
      description: "Open the JD login page in a persistent browser session and return a QR screenshot path."
    },
    async () => handlers.loginJd()
  );

  server.registerTool(
    "login_cainiao",
    {
      title: "Login Cainiao",
      description: "Open Cainiao in a persistent browser session and return a QR/manual-login screenshot path."
    },
    async () => handlers.loginCainiao()
  );

  server.registerTool(
    "sync_packages",
    {
      title: "Sync Packages",
      description: "Sync packages from logged-in Taobao and JD browser sessions into the local cache.",
      inputSchema: {
        source: sourceSchema.optional().describe("Optional provider to sync. Defaults to all configured providers.")
      }
    },
    async (args) => handlers.syncPackages(args)
  );

  server.registerTool(
    "get_my_packages",
    {
      title: "Get My Packages",
      description: "Return waiting packages from the local package cache.",
      inputSchema: {
        source: sourceSchema.optional(),
        status: statusSchema.optional(),
        includeDelivered: z.boolean().optional()
      }
    },
    async (args) => handlers.getMyPackages(args)
  );

  server.registerTool(
    "track_package",
    {
      title: "Track Package",
      description: "Return one package by package ID or tracking number from the local package cache.",
      inputSchema: {
        packageId: z.string().optional(),
        trackingNumber: z.string().optional()
      }
    },
    async (args) => handlers.trackPackage(args)
  );

  server.registerTool(
    "get_delivered_today",
    {
      title: "Get Delivered Today",
      description: "Return packages delivered today in the configured timezone."
    },
    async () => handlers.getDeliveredToday({})
  );

  return {
    server,
    close: async () => {
      await browserSessions.close();
      await server.close();
    }
  };
}

async function main(): Promise<void> {
  const built = buildServer();
  process.once("SIGINT", () => {
    void built.close().finally(() => process.exit(0));
  });
  process.once("SIGTERM", () => {
    void built.close().finally(() => process.exit(0));
  });

  await built.server.connect(new StdioServerTransport());
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFile) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
