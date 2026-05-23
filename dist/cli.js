import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { loadConfig } from "./fingerprint/config.js";
import { buildFingerprint } from "./fingerprint/builder.js";
import { compareFingerprints } from "./fingerprint/comparer.js";
import { formatDiffReport } from "./fingerprint/serializer.js";
const yargsInstance = yargs(hideBin(process.argv));
async function main() {
    await yargsInstance
        .command("record <config>", "Run probes from a config and save a fingerprint", (y) => y
        .positional("config", {
        describe: "Probe config file (JSON)",
        type: "string",
        demandOption: true,
    })
        .option("output", {
        alias: "o",
        describe: "Output fingerprint file",
        type: "string",
        default: "fingerprint.json",
    })
        .option("cwd", {
        describe: "Working directory for probes",
        type: "string",
    }), async (args) => {
        const configPath = args.config;
        const cfg = loadConfig(configPath);
        const fp = await buildFingerprint(cfg, args.cwd);
        const path = (await import("node:path")).resolve(args.output);
        const { writeFileSync } = await import("node:fs");
        writeFileSync(path, JSON.stringify(fp, null, 2));
        console.log(`Fingerprint saved to ${path} (${fp.probes.length} probes)`);
    })
        .command("compare <baseline> <config>", "Compare a fresh run against a saved baseline", (y) => y
        .positional("baseline", {
        describe: "Saved fingerprint file",
        type: "string",
        demandOption: true,
    })
        .positional("config", {
        describe: "Probe config file (JSON)",
        type: "string",
        demandOption: true,
    })
        .option("cwd", {
        describe: "Working directory for probes",
        type: "string",
    }), async (args) => {
        const { readFileSync } = await import("node:fs");
        const { resolve } = await import("node:path");
        const baseline = JSON.parse(readFileSync(args.baseline, "utf-8"));
        const cfg = loadConfig(resolve(args.config));
        const current = await buildFingerprint(cfg, args.cwd);
        const result = compareFingerprints(baseline, current);
        console.log(formatDiffReport(result));
        if (!result.matched)
            process.exit(1);
    })
        .demandCommand(1, "You need to specify a command")
        .strict()
        .help()
        .parse();
}
main().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map