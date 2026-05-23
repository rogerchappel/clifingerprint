import { ProbeConfig, Fingerprint } from "./types.js";
export interface ProbeConfigFile {
    tool: string;
    probes: ProbeConfig[];
}
export declare function validateConfig(config: ProbeConfigFile): void;
export declare function loadConfig(path: string): ProbeConfigFile;
export declare function buildFingerprint(config: ProbeConfigFile, toolDir?: string): Promise<Fingerprint>;
//# sourceMappingURL=builder.d.ts.map