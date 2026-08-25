export function collectProbeFailures(fingerprint) {
  return fingerprint.probes.flatMap((probe) => {
    if (probe.execError) {
      return [`${probe.name}: execution failed: ${probe.execError}`];
    }
    if (probe.timedOut) {
      return [`${probe.name}: timed out`];
    }
    if (probe.expectedExitMatched === false) {
      return [`${probe.name}: expected exit ${probe.expectedExitCode}, received ${probe.exitCode}`];
    }
    return [];
  });
}

export function formatProbeFailures(prefix, failures) {
  return `${prefix}:\n${failures.map((failure) => `- ${failure}`).join("\n")}`;
}
