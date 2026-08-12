#!/usr/bin/env node

import { Command } from "commander";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadConfig } from "./fingerprint/config.js";
import { buildFingerprint } from "./fingerprint/builder.js";
import { compareFingerprints } from "./fingerprint/comparer.js";
import { formatDiffReport, saveFingerprint, loadFingerprint } from "./fingerprint/serializer.js";

const program = new Command();

const pkgFile = resolve(new URL(".", import.meta.url).pathname, "../package.json");
const pkg = JSON.parse(readFileSync(pkgFile, "utf-8"));

program
  .name("cli-fp")
  .alias("clifingerprint")
  .description("Record CLI contracts and detect changes between builds")
  .version(pkg.version)
  .helpOption("-h, --help", "Show help");

program
  .command("record <config>")
  .description("Run probes from config and save a fingerprint")
  .option("-o, --output <path>", "Output fingerprint path", "fingerprint.json")
  .option("--tool-dir <dir>", "Working directory for probes")
  .action(async (configPath, opts) => {
    const cfg = loadConfig(resolve(configPath));
    const fp = await buildFingerprint(cfg, opts.toolDir);
    const failures = fp.probes.flatMap((probe) => {
      if (probe.execError) {
        return [`${probe.name}: execution failed: ${probe.execError}`];
      }
      if (probe.timedOut) {
        return [`${probe.name}: timed out`];
      }
      if (probe.expectedExitMatched === false) {
        return [
          `${probe.name}: expected exit ${probe.expectedExitCode}, received ${probe.exitCode}`,
        ];
      }
      return [];
    });
    if (failures.length > 0) {
      console.error(
        `Fingerprint not saved:\n${failures.map((failure) => `- ${failure}`).join("\n")}`,
      );
      process.exitCode = 1;
      return;
    }
    const out = resolve(opts.output);
    saveFingerprint(out, fp);
    console.log(`Fingerprint saved to ${out} (${fp.probes.length} probes)`);
  });

program
  .command("compare <baseline> <config>")
  .description("Compare a fresh run against a saved baseline")
  .option("--tool-dir <dir>", "Working directory for probes")
  .action(async (baselinePath, configPath, opts) => {
    const baseline = loadFingerprint(resolve(baselinePath));
    const cfg = loadConfig(resolve(configPath));
    const current = await buildFingerprint(cfg, opts.toolDir);
    const result = compareFingerprints(baseline, current);
    console.log(formatDiffReport(result));
    if (!result.matched) process.exit(1);
  });

program
  .command("show <fingerprint>")
  .description("Display a saved fingerprint summary")
  .action((fpPath) => {
    const fp = loadFingerprint(resolve(fpPath));
    console.log(`Tool: ${fp.tool}`);
    console.log(`Recorded: ${fp.timestamp}`);
    console.log(`Probes: ${fp.probes.length}\n`);
    for (const p of fp.probes) {
      const icon = p.exitCode === 0 ? "✓" : "✗";
      console.log(`  ${icon} ${p.name}  exit=${p.exitCode}  ${p.durationMs}ms`);
    }
  });

program.parse(process.argv);
