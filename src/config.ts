import { resolve } from "node:path";

export interface AppConfig {
  dataDir: string;
  profileDir: string;
  artifactDir: string;
  headless: boolean;
  timezone: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env, cwd = process.cwd()): AppConfig {
  return {
    dataDir: resolve(cwd, env.PACKAGE_ASSISTANT_DATA_DIR ?? "./data"),
    profileDir: resolve(cwd, env.PACKAGE_ASSISTANT_PROFILE_DIR ?? "./browser-profiles"),
    artifactDir: resolve(cwd, env.PACKAGE_ASSISTANT_ARTIFACT_DIR ?? "./var"),
    headless: (env.PACKAGE_ASSISTANT_HEADLESS ?? "true").toLowerCase() !== "false",
    timezone: env.PACKAGE_ASSISTANT_TIMEZONE ?? "Asia/Shanghai"
  };
}
