import { readFileSync, writeFileSync } from "node:fs";
import { Fingerprint, CompareResult } from "./types.js";

export function serializeFingerprint(fp: Fingerprint): string {
  return JSON.stringify(fp, null, 2);
}

export function parseFingerprint(data: string): Fingerprint {
  const fp: Fingerprint = JSON.parse(data);
  if (fp.version !== 1) {
    throw new Error(`Unsupported fingerprint version: ${fp.version}`);
  }
  return fp;
}

export function loadFingerprint(path: string): Fingerprint {
  const raw = readFileSync(path, "utf-8");
  return parseFingerprint(raw);
}

export function saveFingerprint(path: string, fp: Fingerprint): void {
  writeFileSync(path, serializeFingerprint(fp), "utf-8");
}

export function formatDiffReport(result: CompareResult): string {
  if (result.matched) {
    return "✓ All probes match the baseline.";
  }

  const lines: string[] = [];
  lines.push("✗ Fingerprint differences detected:\n");

  for (const diff of result.differences) {
    const kind = diff.kind.charAt(0).toUpperCase() + diff.kind.slice(1);
    lines.push(`  [${kind}] ${diff.probeName}`);
    for (const change of diff.changes) {
      lines.push(`    - ${change}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
