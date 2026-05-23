import { readFileSync } from "node:fs";
import { ProbeConfigFile, validateConfig } from "./builder.js";

export function loadConfig(path: string): ProbeConfigFile {
  const raw = readFileSync(path, "utf-8");
  const config = JSON.parse(raw) as ProbeConfigFile;
  validateConfig(config);
  return config;
}
