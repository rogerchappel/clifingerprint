import { readFileSync } from "node:fs";
import { dirname } from "node:path";
import yaml from "js-yaml";

export function loadConfig(path) {
  const raw = readFileSync(path, "utf-8");
  const config = path.endsWith(".json") ? JSON.parse(raw) : yaml.load(raw);
  validateConfig(config);
  return { ...config, configDir: dirname(path) };
}

export function validateConfig(config) {
  if (!config || typeof config !== "object") {
    throw new Error("config must be an object");
  }
  if (!isNonBlankString(config.tool)) {
    throw new Error("config.tool must be a non-empty string");
  }
  if (config.args !== undefined && !isStringArray(config.args)) {
    throw new Error("config.args must be an array of strings when provided");
  }
  if (config.cwd !== undefined && typeof config.cwd !== "string") {
    throw new Error("config.cwd must be a string when provided");
  }
  if (config.stdin !== undefined && typeof config.stdin !== "string") {
    throw new Error("config.stdin must be a string when provided");
  }
  if (config.skip !== undefined && typeof config.skip !== "boolean") {
    throw new Error("config.skip must be a boolean when provided");
  }
  if (config.env !== undefined && !isStringRecord(config.env)) {
    throw new Error("config.env must be an object of string values when provided");
  }
  if (config.envAllowlist !== undefined && !isStringArray(config.envAllowlist)) {
    throw new Error("config.envAllowlist must be an array of strings when provided");
  }
  if (config.packageFile !== undefined && typeof config.packageFile !== "string") {
    throw new Error("config.packageFile must be a string when provided");
  }
  if (
    config.metadata !== undefined &&
    (typeof config.metadata !== "object" || config.metadata === null)
  ) {
    throw new Error("config.metadata must be an object when provided");
  }
  if (!Array.isArray(config.probes) || config.probes.length === 0) {
    throw new Error("config.probes must be a non-empty array");
  }
  const probeNames = new Set();
  for (const probe of config.probes) {
    if (!isNonBlankString(probe.name)) {
      throw new Error("Each probe must have a non-empty name");
    }
    if (probeNames.has(probe.name)) {
      throw new Error(`Probe names must be unique: '${probe.name}'`);
    }
    probeNames.add(probe.name);
    if (probe.tool !== undefined && !isNonBlankString(probe.tool)) {
      throw new Error(`Probe '${probe.name}' tool must be a non-empty string`);
    }
    if (probe.command !== undefined && !isNonBlankString(probe.command)) {
      throw new Error(`Probe '${probe.name}' command must be a non-empty string`);
    }
    if (probe.args !== undefined && !isStringArray(probe.args)) {
      throw new Error(`Probe '${probe.name}' args must be an array of strings`);
    }
    if (probe.cwd !== undefined && typeof probe.cwd !== "string") {
      throw new Error(`Probe '${probe.name}' cwd must be a string`);
    }
    if (probe.stdin !== undefined && typeof probe.stdin !== "string") {
      throw new Error(`Probe '${probe.name}' stdin must be a string`);
    }
    if (probe.skip !== undefined && typeof probe.skip !== "boolean") {
      throw new Error(`Probe '${probe.name}' skip must be a boolean`);
    }
    if (probe.env !== undefined && !isStringRecord(probe.env)) {
      throw new Error(`Probe '${probe.name}' env must be an object of string values`);
    }
    if (probe.envAllowlist !== undefined && !isStringArray(probe.envAllowlist)) {
      throw new Error(`Probe '${probe.name}' envAllowlist must be an array of strings`);
    }
    if (probe.expectedExitCode !== undefined && !Number.isInteger(probe.expectedExitCode)) {
      throw new Error(`Probe '${probe.name}' expectedExitCode must be an integer`);
    }
    if (
      probe.timeoutMs !== undefined &&
      (!Number.isInteger(probe.timeoutMs) || probe.timeoutMs <= 0)
    ) {
      throw new Error(`Probe '${probe.name}' timeoutMs must be a positive integer`);
    }
  }
}

function isNonBlankString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isStringRecord(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((item) => typeof item === "string")
  );
}
