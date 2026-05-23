import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ProbeConfig, ProbeResult, Fingerprint } from "./types.js";
import { runProbe } from "./executor.js";

export interface ProbeConfigFile {
  tool: string;
  probes: ProbeConfig[];
}

export function validateConfig(config: ProbeConfigFile): void {
  if (!config.tool || typeof config.tool !== "string") {
    throw new Error("config.tool must be a non-empty string");
  }
  if (!Array.isArray(config.probes) || config.probes.length === 0) {
    throw new Error("config.probes must be a non-empty array");
  }
  for (const probe of config.probes) {
    if (!probe.name || typeof probe.name !== "string") {
      throw new Error(`probe must have a name: ${JSON.stringify(probe)}`);
    }
    if (!probe.tool || typeof probe.tool !== "string") {
      throw new Error(`probe must have a tool: ${probe.name}`);
    }
  }
}

export function loadConfig(path: string): ProbeConfigFile {
  const raw = readFileSync(path, "utf-8");
  const config: ProbeConfigFile = JSON.parse(raw);
  validateConfig(config);
  return config;
}

export async function buildFingerprint(
  config: ProbeConfigFile,
  toolDir?: string
): Promise<Fingerprint> {
  const results: ProbeResult[] = [];
  for (const probe of config.probes) {
    const result = await runProbe(
      { ...probe, tool: probe.tool ?? config.tool },
      toolDir
    );
    results.push(result);
  }
  return {
    version: 1,
    tool: config.tool,
    timestamp: new Date().toISOString(),
    probes: results,
  };
}
