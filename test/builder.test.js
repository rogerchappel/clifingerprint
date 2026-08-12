import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { buildFingerprint } from "../src/fingerprint/builder.js";

describe("builder", () => {
  it("should build fingerprint from valid config", async () => {
    const config = {
      tool: "echo",
      probes: [{ name: "hello", args: ["hello"], expectedExitCode: 0 }],
    };
    const fp = await buildFingerprint(config);
    assert.strictEqual(fp.version, 1);
    assert.strictEqual(fp.tool, "echo");
    assert.deepStrictEqual(fp.metadata, {});
    assert.strictEqual(fp.package, null);
    assert.strictEqual(fp.probes.length, 1);
    assert.strictEqual(fp.probes[0].name, "hello");
    assert.strictEqual(fp.probes[0].expectedExitMatched, true);
    assert.ok(fp.timestamp);
  });

  it("should include package metadata when configured", async () => {
    const fp = await buildFingerprint({
      tool: "echo",
      packageFile: "package.json",
      metadata: { fixture: true },
      probes: [{ name: "hello", args: ["hello"] }],
    });
    assert.strictEqual(fp.metadata.fixture, true);
    assert.strictEqual(fp.package.name, "clifingerprint");
    assert.strictEqual(fp.package.version, "0.1.0");
    assert.ok(fp.package.bin["cli-fp"]);
  });

  it("should include skipped probes in fingerprint", async () => {
    const config = {
      tool: "echo",
      probes: [{ name: "skip me", tool: "echo", skip: true, expectedExitCode: 0 }],
    };
    const fp = await buildFingerprint(config);
    assert.strictEqual(fp.probes.length, 1);
    assert.strictEqual(fp.probes[0].skipped, true);
    assert.strictEqual(fp.probes[0].exitCode, null);
    assert.strictEqual(fp.probes[0].expectedExitCode, 0);
    assert.strictEqual(fp.probes[0].expectedExitMatched, null);
  });

  it("should preserve timed-out probe status", async () => {
    const fp = await buildFingerprint({
      tool: process.execPath,
      probes: [{ name: "timeout", args: ["-e", "setInterval(() => {}, 1000)"], timeoutMs: 25 }],
    });
    assert.strictEqual(fp.probes[0].timedOut, true);
    assert.strictEqual(fp.probes[0].exitCode, null);
  });

  it("should run multiple probes sequentially", async () => {
    const config = {
      tool: "echo",
      probes: [
        { name: "one", tool: "echo", args: ["one"] },
        { name: "two", tool: "echo", args: ["two"] },
        { name: "fail", tool: "false", args: [] },
      ],
    };
    const fp = await buildFingerprint(config);
    assert.strictEqual(fp.probes.length, 3);
    assert.ok(fp.probes[2].exitCode !== 0);
  });
});
