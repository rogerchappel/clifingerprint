export function buildFingerprint(config: any, toolDir: any): Promise<{
    version: number;
    tool: any;
    metadata: any;
    package: {
        name: any;
        version: any;
        description: any;
        type: any;
        bin: any;
        engines: any;
        dependencies: any;
        peerDependencies: any;
        optionalDependencies: any;
    } | null;
    timestamp: string;
    probes: any[];
}>;
export { loadConfig, validateConfig } from "./config.js";
//# sourceMappingURL=builder.d.ts.map