/** @module clifingerprint/types */

/**
 * @typedef {Object} ProbeConfig
 * @property {string} name - Display name
 * @property {string} tool - Command to execute
 * @property {string[]} [args] - Arguments
 * @property {string} [stdin] - Optional stdin
 * @property {string} [cwd] - Working directory
 * @property {Record<string, string>} [env] - Environment overrides
 * @property {number} [expectedExitCode] - Expected exit code (default 0)
 * @property {number} [timeoutMs] - Timeout in ms (default 10000)
 * @property {boolean} [skip] - Skip this probe
 */

/**
 * @typedef {Object} ProbeResult
 * @property {string} name
 * @property {string} command
 * @property {string} stdout
 * @property {string} stderr
 * @property {number|null} exitCode
 * @property {boolean} timedOut
 * @property {string|null} execError
 * @property {number} durationMs
 * @property {boolean} skipped
 */

/**
 * @typedef {Object} Fingerprint
 * @property {1} version
 * @property {string} tool
 * @property {string} timestamp
 * @property {ProbeResult[]} probes
 */

/**
 * @typedef {Object} CompareResult
 * @property {boolean} matched
 * @property {ProbeDiff[]} differences
 */

/**
 * @typedef {Object} ProbeDiff
 * @property {string} probeName
 * @property {string[]} changes
 * @property {"changed"|"missing"|"new"} kind
 */

export const SCHEMA_VERSION = 1;
