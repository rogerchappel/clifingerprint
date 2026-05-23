import { readFileSync, writeFileSync } from "node:fs";

export function serializeFingerprint(fp) {
  return JSON.stringify(fp, null, 2);
}

export function parseFingerprint(data) {
  const fp = JSON.parse(data);
  if (fp.version !== 1) {
    throw new Error(`Unsupported fingerprint version: ${fp.version}`);
  }
  return fp;
}

export function loadFingerprint(path) {
  const raw = readFileSync(path, "utf-8");
  return parseFingerprint(raw);
}

export function saveFingerprint(path, fp) {
  writeFileSync(path, serializeFingerprint(fp), "utf-8");
}

export function formatDiffReport(result) {
  if (result.matched) return "✓ All probes match the baseline.";
  const lines = ["✗ Fingerprint differences detected:\n"];
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
