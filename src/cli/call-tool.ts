#!/usr/bin/env node
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../config.js";
import { BrowserSessionManager } from "../browser/browser-session-manager.js";
import { JsonPackageStore } from "../storage/json-package-store.js";
import { createToolHandlers, type ToolHandlers } from "../mcp/tool-handlers.js";
import { CainiaoProvider } from "../providers/cainiao-provider.js";
import { JdProvider } from "../providers/jd-provider.js";
import { TaobaoProvider } from "../providers/taobao-provider.js";

type ToolName = keyof ToolHandlers;

const TOOL_NAME_ALIASES: Record<string, ToolName> = {
  login_taobao: "loginTaobao",
  login_jd: "loginJd",
  login_cainiao: "loginCainiao",
  sync_packages: "syncPackages",
  get_my_packages: "getMyPackages",
  track_package: "trackPackage",
  get_delivered_today: "getDeliveredToday"
};

export function resolveToolName(input: string): ToolName {
  return TOOL_NAME_ALIASES[input] ?? (input as ToolName);
}

async function main(): Promise<void> {
  const [toolNameInput, jsonInput = "{}"] = process.argv.slice(2) as [string | undefined, string?];
  if (!toolNameInput) {
    throw new Error(`Usage: node dist/cli/call-tool.js <toolName> [jsonInput]`);
  }

  const config = loadConfig();
  const browserSessions = new BrowserSessionManager({
    profileRoot: config.profileDir,
    headless: config.headless
  });

  try {
    const handlers = createToolHandlers({
      store: new JsonPackageStore(join(config.dataDir, "packages.json")),
      timezone: config.timezone,
      providers: [
        new TaobaoProvider(browserSessions.getSession("taobao"), { artifactDir: config.artifactDir }),
        new JdProvider(browserSessions.getSession("jd"), { artifactDir: config.artifactDir }),
        new CainiaoProvider(browserSessions.getSession("cainiao"), { artifactDir: config.artifactDir })
      ]
    });

    const toolName = resolveToolName(toolNameInput);
    const handler = handlers[toolName];
    if (typeof handler !== "function") {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    const input = JSON.parse(jsonInput ?? "{}") as never;
    const result = await handler(input);
    console.log(JSON.stringify(result.structuredContent, null, 2));
  } finally {
    await browserSessions.close();
  }
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFile) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
