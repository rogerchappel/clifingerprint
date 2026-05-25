import { runProbe } from "./executor.js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
export { loadConfig, validateConfig } from "./config.js";
export async function buildFingerprint(config, toolDir) {
    const results = [];
    for (const probe of config.probes) {
        const result = await runProbe({
            ...probe,
            tool: probe.tool ?? config.tool,
            args: probe.args ?? config.args,
            cwd: probe.cwd ?? config.cwd,
            envAllowlist: probe.envAllowlist ?? config.envAllowlist,
            env: { ...(config.env ?? {}), ...(probe.env ?? {}) },
        }, toolDir);
        results.push(result);
    }
    return {
        version: 1,
        tool: config.tool,
        metadata: config.metadata ?? {},
        package: loadPackageMetadata(config, toolDir),
        timestamp: new Date().toISOString(),
        probes: results,
    };
}
function loadPackageMetadata(config, toolDir) {
    if (!config.packageFile)
        return null;
    const baseDir = config.configDir ?? toolDir ?? process.cwd();
    const packagePath = resolve(baseDir, config.packageFile);
    const pkg = JSON.parse(readFileSync(packagePath, "utf-8"));
    return {
        name: pkg.name ?? null,
        version: pkg.version ?? null,
        description: pkg.description ?? null,
        type: pkg.type ?? null,
        bin: pkg.bin ?? null,
        engines: pkg.engines ?? null,
        dependencies: pkg.dependencies ?? null,
        peerDependencies: pkg.peerDependencies ?? null,
        optionalDependencies: pkg.optionalDependencies ?? null,
    };
}
//# sourceMappingURL=builder.js.map