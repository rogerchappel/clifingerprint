import { runProbe } from "./executor.js";
import { readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
export { loadConfig, validateConfig } from "./config.js";
export async function buildFingerprint(config, toolDir) {
    const baseDir = resolve(toolDir ?? config.configDir ?? process.cwd());
    const results = [];
    for (const probe of config.probes) {
        const result = await runProbe({
            ...probe,
            tool: probe.tool ?? config.tool,
            args: probe.args ?? config.args,
            cwd: resolveProbeCwd(probe.cwd ?? config.cwd, baseDir),
            stdin: probe.stdin ?? config.stdin,
            skip: probe.skip ?? config.skip,
            envAllowlist: probe.envAllowlist ?? config.envAllowlist,
            env: { ...(config.env ?? {}), ...(probe.env ?? {}) },
        }, baseDir);
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
    const baseDir = toolDir ?? config.configDir ?? process.cwd();
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
function resolveProbeCwd(cwd, baseDir) {
    if (cwd === undefined)
        return baseDir;
    return isAbsolute(cwd) ? cwd : resolve(baseDir, cwd);
}
//# sourceMappingURL=builder.js.map