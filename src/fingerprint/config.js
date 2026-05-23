import { readFileSync } from "node:fs";
import yaml from "js-yaml";

export function loadConfig(path) {
  const raw = readFileSync(path, "utf-8");
  const config = path.endsWith(".json") ? JSON.parse(raw) : yaml.load(raw);
  validateConfig(config);
  return config;
}

export function validateConfig(config) {
  if (!config.tool || typeof config.tool !== "string") {
    throw new Error("config.tool must be a non-empty string");
  }
  if (!Array.isArray(config.probes) || config.probes.length === 0) {
    throw new Error("config.probes must be a non-empty array");
  }
  for (const probe of config.probes) {
    if (!probe.name || typeof probe.name !== "string") {
      throw new Error("Each probe must have a name");
    }
    if (!probe.tool || typeof probe.tool !== "string") {
      throw new Error(`Probe '${probe.name}' must have a tool`);
    }
  }
}
