import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { loadConfig, validateConfig, buildFingerprint } from "../src/fingerprint/index.js";
import { runProbe } from "../src/fingerprint/executor.js";

describe("config validation", () => {
  it("should accept a valid probe config", () => {
    const cfg = {
      tool: "echo",
      probes: [{ name: "test", tool: "echo", args: ["hello"] }],
    };
    assert.doesNotThrow(() => validateConfig(cfg));
  });

  it("should reject missing tool", () => {
    assert.throws(() => validateConfig({ probes: [] }), /tool/);
  });

  it("should reject empty probes array", () => {
    assert.throws(() => validateConfig({ tool: "echo", probes: [] }), /non-empty array/);
  });

  it("should reject probe without name", () => {
    assert.throws(
      () =>
        validateConfig({
          tool: "echo",
          probes: [{ tool: "echo", args: [] }],
        }),
      /name/,
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

  it("should load YAML config from clifingerprint.yaml", () => {
    const cfg = loadConfig("./clifingerprint.yaml");
    assert.strictEqual(cfg.tool, "bash fixtures/stable-cli.js");
    assert.strictEqual(cfg.probes.length >= 2, true);
  });
});

describe("executor with fixture CLIs", () => {
  it("should record stable-cli --help output", async () => {
    const result = await runProbe({
      name: "stable-help",
      tool: "node",
      args: ["test/fixtures/stable-cli.js", "--help"],
      timeoutMs: 5000,
    });
    assert.strictEqual(result.exitCode, 0);
    assert.ok(result.stdout.includes("--help"));
    assert.ok(result.stdout.includes("--version"));
  });

  it("should record stable-cli --version output", async () => {
    const result = await runProbe({
      name: "stable-version",
      tool: "node",
      args: ["test/fixtures/stable-cli.js", "--version"],
      timeoutMs: 5000,
    });
    assert.strictEqual(result.exitCode, 0);
    assert.ok(result.stdout.includes("1.0.0"));
  });

  it("should record stable-cli greet command", async () => {
    const result = await runProbe({
      name: "stable-greet",
      tool: "node",
      args: ["test/fixtures/stable-cli.js", "greet", "--name", "Test"],
      timeoutMs: 5000,
    });
    assert.strictEqual(result.exitCode, 0);
    assert.ok(result.stdout.includes("Hello, Test!"));
  });

  it("should record stable-cli fail command exit code 1", async () => {
    const result = await runProbe({
      name: "stable-fail",
      tool: "node",
      args: ["test/fixtures/stable-cli.js", "fail"],
      timeoutMs: 5000,
    });
    assert.strictEqual(result.exitCode, 1);
    assert.ok(result.stderr.includes("Intentional failure"));
  });

  it("should produce same fingerprint for stable-cli on repeated runs", async () => {
    const fp1 = await buildFingerprint({
      tool: "node test/fixtures/stable-cli.js",
      probes: [
        {
          name: "help",
          tool: "node",
          args: ["test/fixtures/stable-cli.js", "--help"],
          timeoutMs: 5000,
        },
        {
          name: "version",
          tool: "node",
          args: ["test/fixtures/stable-cli.js", "--version"],
          timeoutMs: 5000,
        },
      ],
    });
    const fp2 = await buildFingerprint({
      tool: "node test/fixtures/stable-cli.js",
      probes: [
        {
          name: "help",
          tool: "node",
          args: ["test/fixtures/stable-cli.js", "--help"],
          timeoutMs: 5000,
        },
        {
          name: "version",
          tool: "node",
          args: ["test/fixtures/stable-cli.js", "--version"],
          timeoutMs: 5000,
        },
      ],
    });
    const { compareFingerprints } = await import("../src/fingerprint/comparer.js");
    const result = compareFingerprints(fp1, fp2);
    assert.strictEqual(result.matched, true);
  });
});

describe("changing-cli detection", () => {
  it("should detect changes between v1 and v2", async () => {
    // Use same probe names for direct comparison
    const v1same = await buildFingerprint({
      tool: "node test/fixtures/changing-cli.js",
      probes: [
        {
          name: "same",
          tool: "node",
          env: { CLIFINGERPRINT_VERSION: "v1" },
          args: ["test/fixtures/changing-cli.js", "--help"],
          timeoutMs: 5000,
        },
      ],
    });
    const v2same = await buildFingerprint({
      tool: "node test/fixtures/changing-cli.js",
      probes: [
        {
          name: "same",
          tool: "node",
          env: { CLIFINGERPRINT_VERSION: "v2" },
          args: ["test/fixtures/changing-cli.js", "--help"],
          timeoutMs: 5000,
        },
      ],
    });
    const { compareFingerprints } = await import("../src/fingerprint/comparer.js");
    const result = compareFingerprints(v1same, v2same);
    assert.strictEqual(result.matched, false);
    assert.ok(result.differences[0].changes.includes("stdout changed"));
  });
});
