import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { loadConfig, validateConfig, buildFingerprint } from "../dist/fingerprint/index.js";

describe("config validation", () => {
  it("should accept a valid probe config", () => {
    const cfg = {
      tool: "echo",
      probes: [{ name: "test", tool: "echo", args: ["hello"] }],
    };
    assert.doesNotThrow(() => validateConfig(cfg));
  });

  it("should reject missing tool", () => {
    assert.throws(
      () => validateConfig({ probes: [] }),
      /tool/
    );
  });

  it("should reject empty probes array", () => {
    assert.throws(
      () => validateConfig({ tool: "echo", probes: [] }),
      /non-empty array/
    );
  });

  it("should reject probe without name", () => {
    assert.throws(
      () =>
        validateConfig({
          tool: "echo",
          probes: [{ tool: "echo", args: [] }],
        }),
      /name/
    );
  });

  it("should accept probe with skip flag", () => {
    const cfg = {
      tool: "echo",
      probes: [
        { name: "skip me", tool: "echo", skip: true },
        { name: "run me", tool: "echo", args: ["hi"] },
      ],
    };
    assert.doesNotThrow(() => validateConfig(cfg));
  });
});

describe("config loading", () => {
  it("should load greeter probe config from fixtures", () => {
    const cfg = loadConfig("./fixtures/greeter-probes.json");
    assert.strictEqual(cfg.tool, "bash fixtures/greeter.sh");
    assert.strictEqual(cfg.probes.length > 0, true);
  });

  it("should load toolkit probe config from fixtures", () => {
    const cfg = loadConfig("./fixtures/toolkit-probes.json");
    assert.strictEqual(cfg.tool, "bash fixtures/toolkit.sh");
    assert.strictEqual(cfg.probes.length > 0, true);
  });
});
