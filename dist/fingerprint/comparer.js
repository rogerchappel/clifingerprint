/** Compare two fingerprints and return differences */
export function compareFingerprints(baseline, current) {
    const differences = [];
    const packageChanges = comparePackageMetadata(baseline.package, current.package);
    if (packageChanges.length > 0) {
        differences.push({
            probeName: "package",
            changes: packageChanges,
            kind: "metadata",
        });
    }
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
        if (baselineProbe.command !== currentProbe.command)
            changes.push(`command changed: ${baselineProbe.command} -> ${currentProbe.command}`);
        if (baselineProbe.stdout !== currentProbe.stdout) {
            const flagChanges = compareFlags(baselineProbe.stdout, currentProbe.stdout);
            changes.push("stdout changed");
            changes.push(...flagChanges);
        }
        if (baselineProbe.stderr !== currentProbe.stderr)
            changes.push("stderr changed");
        if (baselineProbe.exitCode !== currentProbe.exitCode)
            changes.push(`exit code changed: ${baselineProbe.exitCode} -> ${currentProbe.exitCode}`);
        if (baselineProbe.expectedExitCode !== currentProbe.expectedExitCode)
            changes.push(`expected exit changed: ${baselineProbe.expectedExitCode} -> ${currentProbe.expectedExitCode}`);
        if (baselineProbe.expectedExitMatched !== currentProbe.expectedExitMatched)
            changes.push(`expected exit match changed: ${baselineProbe.expectedExitMatched} -> ${currentProbe.expectedExitMatched}`);
        if (baselineProbe.timedOut !== currentProbe.timedOut)
            changes.push(`timeout status changed: ${baselineProbe.timedOut} -> ${currentProbe.timedOut}`);
        if (baselineProbe.execError !== currentProbe.execError)
            changes.push("execution error changed");
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
function compareFlags(baselineText, currentText) {
    const baselineFlags = extractFlags(baselineText);
    const currentFlags = extractFlags(currentText);
    const changes = [];
    for (const flag of baselineFlags) {
        if (!currentFlags.has(flag))
            changes.push(`flag removed: ${flag}`);
    }
    for (const flag of currentFlags) {
        if (!baselineFlags.has(flag))
            changes.push(`flag added: ${flag}`);
    }
    return changes;
}
function extractFlags(text) {
    return new Set(text.match(/--[a-zA-Z0-9][a-zA-Z0-9-]*/g) ?? []);
}
function comparePackageMetadata(baselinePackage, currentPackage) {
    if (!baselinePackage && !currentPackage)
        return [];
    if (!baselinePackage)
        return ["package metadata added"];
    if (!currentPackage)
        return ["package metadata removed"];
    const changes = [];
    const keys = new Set([...Object.keys(baselinePackage), ...Object.keys(currentPackage)]);
    for (const key of keys) {
        const baselineValue = stableStringify(baselinePackage[key]);
        const currentValue = stableStringify(currentPackage[key]);
        if (baselineValue !== currentValue) {
            changes.push(`package ${key} changed: ${baselineValue} -> ${currentValue}`);
        }
    }
    return changes;
}
function stableStringify(value) {
    if (value === undefined)
        return "undefined";
    if (value === null)
        return "null";
    if (typeof value !== "object")
        return String(value);
    return JSON.stringify(sortObject(value));
}
function sortObject(value) {
    if (Array.isArray(value))
        return value.map(sortObject);
    if (value === null || typeof value !== "object")
        return value;
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
}
//# sourceMappingURL=comparer.js.map