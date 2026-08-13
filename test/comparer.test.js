import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { buildFingerprint } from "../src/fingerprint/builder.js";
import { compareFingerprints } from "../src/fingerprint/comparer.js";

describe("comparer", () => {
  const makeFP = async (probes) => {
    return buildFingerprint({
      tool: "echo",
      probes,
    });
  };

  it("should return matched when fingerprints are identical", async () => {
    const cfg = { tool: "echo", probes: [{ name: "hi", tool: "echo", args: ["hi"] }] };
    const fp1 = await makeFP(cfg.probes);
    const fp2 = await makeFP(cfg.probes);
    const result = compareFingerprints(fp1, fp2);
    assert.strictEqual(result.matched, true);
    assert.strictEqual(result.differences.length, 0);
  });

  it("should detect changed stdout", async () => {
    const baseline = await makeFP([{ name: "cmd", tool: "bash", args: ["-c", "echo one"] }]);
    const current = await makeFP([{ name: "cmd", tool: "bash", args: ["-c", "echo two"] }]);
    const result = compareFingerprints(baseline, current);
    assert.strictEqual(result.matched, false);
    assert.strictEqual(result.differences[0].probeName, "cmd");
    assert.strictEqual(result.differences[0].kind, "changed");
    assert.ok(result.differences[0].changes.includes("stdout changed"));
  });

  it("should reject duplicate probe names instead of discarding an earlier change", () => {
    const baseline = {
      probes: [
        { name: "duplicate", stdout: "first-v1" },
        { name: "duplicate", stdout: "stable-last" },
      ],
    };
    const current = {
      probes: [
        { name: "duplicate", stdout: "first-v2" },
        { name: "duplicate", stdout: "stable-last" },
      ],
    };

    assert.throws(
      () => compareFingerprints(baseline, current),
      /Baseline fingerprint contains duplicate probe name 'duplicate'/,
    );
  });

  it("should highlight option flag changes in help output", () => {
    const baseline = {
      version: 1,
      tool: "test",
      timestamp: "2000-01-01T00:00:00Z",
      probes: [
        {
          name: "help",
          command: "test --help",
          stdout: "Options:\n  --help\n  --debug\n",
          stderr: "",
          exitCode: 0,
          timedOut: false,
          execError: null,
          durationMs: 1,
          skipped: false,
        },
      ],
    };
    const current = {
      ...baseline,
      probes: [{ ...baseline.probes[0], stdout: "Options:\n  --help\n  --color\n" }],
    };
    const result = compareFingerprints(baseline, current);
    assert.strictEqual(result.matched, false);
    assert.ok(result.differences[0].changes.includes("flag removed: --debug"));
    assert.ok(result.differences[0].changes.includes("flag added: --color"));
  });

  it("should detect package metadata changes", () => {
    const baseline = {
      version: 1,
      tool: "test",
      package: { name: "tool", version: "1.0.0", bin: { tool: "cli.js" } },
      timestamp: "2000-01-01T00:00:00Z",
      probes: [],
    };
    const current = {
      ...baseline,
      package: { name: "tool", version: "2.0.0", bin: { tool: "cli.js" } },
    };
    const result = compareFingerprints(baseline, current);
    assert.strictEqual(result.matched, false);
    assert.strictEqual(result.differences[0].kind, "metadata");
    assert.ok(result.differences[0].changes.some((change) => change.includes("version")));
  });

  it("should detect missing probe", async () => {
    const baseline = await makeFP([
      { name: "one", tool: "echo", args: ["one"] },
      { name: "two", tool: "echo", args: ["two"] },
    ]);
    const current = await makeFP([{ name: "one", tool: "echo", args: ["one"] }]);
    const result = compareFingerprints(baseline, current);
    assert.strictEqual(result.matched, false);
    const missing = result.differences.find((d) => d.kind === "missing");
    assert.ok(missing);
    assert.strictEqual(missing.probeName, "two");
  });

  it("should detect new probe", async () => {
    const baseline = await makeFP([{ name: "one", tool: "echo", args: ["one"] }]);
    const current = await makeFP([
      { name: "one", tool: "echo", args: ["one"] },
      { name: "two", tool: "echo", args: ["two"] },
    ]);
    const result = compareFingerprints(baseline, current);
    assert.strictEqual(result.matched, false);
    const newDiff = result.differences.find((d) => d.kind === "new");
    assert.ok(newDiff);
    assert.strictEqual(newDiff.probeName, "two");
  });

  it("should detect exit code changes", async () => {
    const baseline = await makeFP([{ name: "ok", tool: "true" }]);
    const current = await makeFP([{ name: "ok", tool: "false" }]);
    const result = compareFingerprints(baseline, current);
    assert.strictEqual(result.matched, false);
    const diff = result.differences[0];
    assert.ok(diff.changes.some((c) => c.includes("exit code")));
  });

  it("should detect timeout changes", () => {
    const baseline = {
      version: 1,
      tool: "test",
      timestamp: "2000-01-01T00:00:00Z",
      probes: [
        {
          name: "slow",
          command: "sleep 30",
          stdout: "",
          stderr: "",
          exitCode: null,
          timedOut: true,
          execError: null,
          durationMs: 100,
          skipped: false,
        },
      ],
    };
    const current = {
      version: 1,
      tool: "test",
      timestamp: "2000-01-01T00:00:00Z",
      probes: [
        {
          name: "slow",
          command: "sleep 30",
          stdout: "",
          stderr: "",
          exitCode: 0,
          timedOut: false,
          execError: null,
          durationMs: 200,
          skipped: false,
        },
      ],
    };
    const result = compareFingerprints(baseline, current);
    assert.strictEqual(result.matched, false);
    assert.ok(result.differences[0].changes.some((c) => c.includes("timeout")));
  });
});
