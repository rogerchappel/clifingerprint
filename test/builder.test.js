import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { buildFingerprint } from "../dist/fingerprint/builder.js";

describe("builder", () => {
  it("should build fingerprint from valid config", async () => {
    const config = {
      tool: "echo",
      probes: [
        { name: "hello", tool: "echo", args: ["hello"] }
      ]
    };
    const fp = await buildFingerprint(config);
    assert.strictEqual(fp.version, 1);
    assert.strictEqual(fp.tool, "echo");
    assert.strictEqual(fp.probes.length, 1);
    assert.strictEqual(fp.probes[0].name, "hello");
    assert.ok(fp.timestamp);
  });

  it("should include skipped probes in fingerprint", async () => {
    const config = {
      tool: "echo",
      probes: [
        { name: "skip me", tool: "echo", skip: true }
      ]
    };
    const fp = await buildFingerprint(config);
    assert.strictEqual(fp.probes.length, 1);
    assert.strictEqual(fp.probes[0].skipped, true);
    assert.strictEqual(fp.probes[0].exitCode, null);
  });

  it("should run multiple probes sequentially", async () => {
    const config = {
      tool: "echo",
      probes: [
        { name: "one", tool: "echo", args: ["one"] },
        { name: "two", tool: "echo", args: ["two"] },
        { name: "fail", tool: "false", args: [] }
      ]
    };
    const fp = await buildFingerprint(config);
    assert.strictEqual(fp.probes.length, 3);
    assert.ok(fp.probes[2].exitCode !== 0);
  });
});
