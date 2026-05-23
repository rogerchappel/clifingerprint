/**
 * Core data types for CLI fingerprint recording.
 *
 * A "probe" describes a single command invocation and its expected contract.
 * A "fingerprint" is a collection of probe results, timestamped.
 */
export interface ProbeConfig {
    /** Display name for this probe */
    name: string;
    /** Command to execute (binary name, relative to cwd or PATH) */
    tool: string;
    /** Arguments to pass */
    args?: string[];
    /** Optional stdin to pipe */
    stdin?: string;
    /** Working directory for the probe */
    cwd?: string;
    /** Environment variables to inject */
    env?: Record<string, string>;
    /** Expected exit code (defaults to 0) */
    expectedExitCode?: number;
    /** Maximum time in ms before the probe is killed */
    timeoutMs?: number;
    /** Whether to skip this probe */
    skip?: boolean;
}
export interface ProbeResult {
    name: string;
    command: string;
    stdout: string;
    stderr: string;
    exitCode: number | null;
    timedOut: boolean;
    execError: string | null;
    durationMs: number;
    skipped: boolean;
}
export interface Fingerprint {
    version: 1;
    tool: string;
    timestamp: string;
    probes: ProbeResult[];
}
export interface CompareResult {
    matched: boolean;
    differences: ProbeDiff[];
}
export interface ProbeDiff {
    probeName: string;
    changes: string[];
    kind: "changed" | "missing" | "new";
}
//# sourceMappingURL=types.d.ts.map