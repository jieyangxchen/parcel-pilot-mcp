#!/usr/bin/env node
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { loadConfig } from "../config.js";
import type { PackageSource } from "../domain/types.js";

const LOGIN_URLS: Record<PackageSource, string> = {
  taobao: "https://login.taobao.com/member/login.jhtml",
  jd: "https://passport.jd.com/new/login.aspx",
  cainiao: "https://www.cainiao.com/"
};

export function getProviderLoginUrl(provider: string): string {
  if (provider !== "taobao" && provider !== "jd" && provider !== "cainiao") {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  return LOGIN_URLS[provider];
}

async function main(): Promise<void> {
  const provider = process.argv[2] ?? "taobao";
  const config = loadConfig();
  const profileDir = join(config.profileDir, provider);
  await mkdir(profileDir, { recursive: true });

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    viewport: { width: 1366, height: 900 },
    locale: "zh-CN",
    timezoneId: config.timezone
  });

  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto(getProviderLoginUrl(provider), { waitUntil: "domcontentloaded" });

  console.log(`Opened ${provider} login page. Keep this process running while you finish login.`);
  await new Promise<void>((resolve) => {
    process.once("SIGINT", resolve);
    process.once("SIGTERM", resolve);
  });

  await context.close();
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFile) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
