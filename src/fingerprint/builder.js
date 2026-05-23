import { loadConfig, validateConfig } from "./config.js";
import { runProbe } from "./executor.js";

export { loadConfig } from "./config.js";
export { validateConfig } from "./config.js";

export async function buildFingerprint(config, toolDir) {
  const results = [];
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
