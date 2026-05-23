import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import {
  serializeFingerprint,
  parseFingerprint,
  formatDiffReport,
  loadFingerprint,
  saveFingerprint,
} from "../dist/fingerprint/serializer.js";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { unlinkSync, existsSync } from "node:fs";

describe("serializer", () => {
  const fp = {
    version: 1,
    tool: "my-cli",
    timestamp: "2025-01-01T00:00:00.000Z",
    probes: [
      {
        name: "help",
        command: "my-cli --help",
        stdout: "Usage: my-cli",
        stderr: "",
        exitCode: 0,
        timedOut: false,
        execError: null,
        durationMs: 10,
        skipped: false,
      },
    ],
  };

  it("should round-trip serialize and deserialize a fingerprint", () => {
    const serialized = serializeFingerprint(fp);
    const parsed = parseFingerprint(serialized);
    assert.strictEqual(parsed.tool, fp.tool);
    assert.strictEqual(parsed.probes.length, 1);
    assert.strictEqual(parsed.probes[0].stdout, fp.probes[0].stdout);
    assert.strictEqual(parsed.probes[0].exitCode, 0);
  });

  it("should reject unsupported fingerprint version", () => {
    assert.throws(() => {
      parseFingerprint(
        JSON.stringify({ version: 99, tool: "x", timestamp: "x", probes: [] })
      );
    }, /version/);
  });

  it("should save and load a fingerprint from file", () => {
    const tmpPath = join(tmpdir(), `test-fp-${Date.now()}.json`);
    try {
      saveFingerprint(tmpPath, fp);
      assert.ok(existsSync(tmpPath));
      const loaded = loadFingerprint(tmpPath);
      assert.strictEqual(loaded.tool, fp.tool);
    } finally {
      try {
        unlinkSync(tmpPath);
      } catch {
        /* ignore */
      }
    }
  });

  it("should format a matching report", () => {
    const report = formatDiffReport({ matched: true, differences: [] });
    assert.ok(report.includes("match"));
  });

  it("should format a diff report with changes", () => {
    const report = formatDiffReport({
      matched: false,
      differences: [
        {
          probeName: "help",
          changes: ["stdout changed"],
          kind: "changed",
        },
        {
          probeName: "version",
          changes: ["new probe"],
          kind: "new",
        },
      ],
    });
    assert.ok(report.includes("help"));
    assert.ok(report.includes("stdout changed"));
    assert.ok(report.includes("version"));
  });

  it("should format a report with missing probes", () => {
    const report = formatDiffReport({
      matched: false,
      differences: [
        {
          probeName: "deploy",
          changes: ["probe removed"],
          kind: "missing",
        },
      ],
    });
    assert.ok(report.includes("deploy"));
    assert.ok(report.includes("missing"));
  });
});
