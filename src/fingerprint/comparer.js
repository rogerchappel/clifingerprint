/** Compare two fingerprints and return differences */
export function compareFingerprints(baseline, current) {
  const differences = [];
  const baselineMap = new Map(baseline.probes.map((p) => [p.name, p]));
  const currentMap = new Map(current.probes.map((p) => [p.name, p]));

  for (const [name, baselineProbe] of baselineMap) {
    const currentProbe = currentMap.get(name);
    if (!currentProbe) {
      differences.push({
        probeName: name,
        changes: ["Probe removed in current fingerprint"],
        kind: "missing",
      });
      continue;
    }

    const changes = [];
    if (baselineProbe.stdout !== currentProbe.stdout) changes.push("stdout changed");
    if (baselineProbe.stderr !== currentProbe.stderr) changes.push("stderr changed");
    if (baselineProbe.exitCode !== currentProbe.exitCode)
      changes.push(`exit code changed: ${baselineProbe.exitCode} -> ${currentProbe.exitCode}`);
    if (baselineProbe.timedOut !== currentProbe.timedOut)
      changes.push(`timeout status changed: ${baselineProbe.timedOut} -> ${currentProbe.timedOut}`);
    if (baselineProbe.execError !== currentProbe.execError) changes.push("execution error changed");
    if (baselineProbe.skipped !== currentProbe.skipped)
      changes.push(`skip status changed: ${baselineProbe.skipped} -> ${currentProbe.skipped}`);

    if (changes.length > 0) {
      differences.push({ probeName: name, changes, kind: "changed" });
    }
  }

  for (const [name] of currentMap) {
    if (!baselineMap.has(name)) {
      differences.push({
        probeName: name,
        changes: ["Probe added in current fingerprint"],
        kind: "new",
      });
    }
  }

  return { matched: differences.length === 0, differences };
}
