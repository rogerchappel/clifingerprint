import { describe, it } from "node:test";
import assert from "node:assert";
import { execSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("clifingerprint CLI", () => {
  it("should show help output", () => {
    const out = execSync("node dist/cli.js --help", { encoding: "utf8" });
    assert.ok(
      out.includes("fingerprint") || out.includes("cli"),
      "help should mention fingerprint",
    );
  });

  it("should require a config or path argument", () => {
    try {
      execSync("node dist/cli.js", { encoding: "utf8", stdio: "pipe" });
      assert.ok(false, "should have failed");
    } catch (e) {
      assert.ok(e.status !== 0, "should exit non-zero without args");
    }
  });

  it("should record a fingerprint from a config", () => {
    const dir = mkdtempSync(join(tmpdir(), "clifingerprint-"));
    const configPath = join(dir, "probes.json");
    const outputPath = join(dir, "fingerprint.json");
    copyFileSync("test/fixtures/stable-cli.js", join(dir, "stable-cli.js"));
    writeFileSync(
      configPath,
      JSON.stringify({
        tool: "node",
        probes: [
          {
            name: "version",
            args: ["stable-cli.js", "--version"],
            expectedExitCode: 0,
          },
        ],
      }),
    );

    const out = execSync(`node dist/cli.js record ${configPath} --output ${outputPath}`, {
      encoding: "utf8",
    });
    const fingerprint = JSON.parse(readFileSync(outputPath, "utf8"));

    assert.ok(out.includes("Fingerprint saved"), "record should report the saved fingerprint");
    assert.strictEqual(fingerprint.probes.length, 1);
  });

  it("should fail record when a probe cannot be executed", () => {
    const result = recordConfig({
      tool: "missing-clifingerprint-command",
      probes: [{ name: "missing", expectedExitCode: 0, timeoutMs: 100 }],
    });

    assert.strictEqual(result.status, 1);
    assert.match(result.stderr, /missing: execution failed/);
    assert.doesNotMatch(result.stdout, /Fingerprint saved/);
  });

  it("should fail record when a probe misses its expected exit code", () => {
    const result = recordConfig({
      tool: "node test/fixtures/stable-cli.js",
      probes: [{ name: "unexpected exit", args: ["fail"], expectedExitCode: 0 }],
    });

    assert.strictEqual(result.status, 1);
    assert.match(result.stderr, /unexpected exit: expected exit 0, received 1/);
    assert.doesNotMatch(result.stdout, /Fingerprint saved/);
  });

  it("should save record when a probe with an expected exit is skipped", () => {
    const result = recordConfig({
      tool: "node",
      probes: [{ name: "optional probe", skip: true, expectedExitCode: 0 }],
    });

    assert.strictEqual(result.status, 0);
    assert.match(result.stdout, /Fingerprint saved/);
    assert.strictEqual(result.outputExists, true);
  });

  it("should fail record without saving when a probe times out", () => {
    const result = recordConfig({
      tool: process.execPath,
      probes: [{ name: "slow probe", args: ["-e", "setInterval(() => {}, 1000)"], timeoutMs: 25 }],
    });

    assert.strictEqual(result.status, 1);
    assert.match(result.stderr, /slow probe: timed out/);
    assert.doesNotMatch(result.stdout, /Fingerprint saved/);
    assert.strictEqual(result.outputExists, false);
  });

  it("should fail compare when matching fingerprints contain execution errors", () => {
    const result = compareConfig(
      {
        tool: "missing-clifingerprint-command",
        probes: [{ name: "missing", expectedExitCode: 0, timeoutMs: 100 }],
      },
      {
        name: "missing",
        command: "missing-clifingerprint-command",
        stdout: "",
        stderr: "",
        exitCode: null,
        expectedExitCode: 0,
        expectedExitMatched: false,
        timedOut: false,
        execError: "spawn missing-clifingerprint-command ENOENT",
        skipped: false,
      },
    );

    assert.strictEqual(result.status, 1);
    assert.match(result.stderr, /Comparison failed:\n- missing: execution failed/);
    assert.doesNotMatch(result.stdout, /All probes match/);
  });

  it("should fail compare when matching fingerprints contain timeouts", () => {
    const result = compareConfig(
      {
        tool: process.execPath,
        probes: [
          { name: "slow probe", args: ["-e", "setInterval(() => {}, 1000)"], timeoutMs: 25 },
        ],
      },
      {
        name: "slow probe",
        command: `${process.execPath} -e "setInterval(() => {}, 1000)"`,
        stdout: "",
        stderr: "",
        exitCode: null,
        expectedExitCode: null,
        expectedExitMatched: null,
        timedOut: true,
        execError: null,
        skipped: false,
      },
    );

    assert.strictEqual(result.status, 1);
    assert.match(result.stderr, /Comparison failed:\n- slow probe: timed out/);
    assert.doesNotMatch(result.stdout, /All probes match/);
  });

  it("should fail compare when matching fingerprints miss expected exits", () => {
    const result = compareConfig(
      {
        tool: `${process.execPath} ${join(process.cwd(), "test/fixtures/stable-cli.js")}`,
        probes: [{ name: "unexpected exit", args: ["fail"], expectedExitCode: 0 }],
      },
      {
        name: "unexpected exit",
        command: `${process.execPath} ${join(process.cwd(), "test/fixtures/stable-cli.js")} fail`,
        stdout: "",
        stderr: "intentional failure\n",
        exitCode: 1,
        expectedExitCode: 0,
        expectedExitMatched: false,
        timedOut: false,
        execError: null,
        skipped: false,
      },
    );

    assert.strictEqual(result.status, 1);
    assert.match(result.stderr, /unexpected exit: expected exit 0, received 1/);
    assert.doesNotMatch(result.stdout, /All probes match/);
  });

  it("should report a normal matching comparison", () => {
    const result = compareConfig(
      {
        tool: `${process.execPath} ${join(process.cwd(), "test/fixtures/stable-cli.js")}`,
        probes: [{ name: "version", args: ["--version"], expectedExitCode: 0 }],
      },
      {
        name: "version",
        command: `${process.execPath} ${join(process.cwd(), "test/fixtures/stable-cli.js")} --version`,
        stdout: "1.0.0\n",
        stderr: "",
        exitCode: 0,
        expectedExitCode: 0,
        expectedExitMatched: true,
        timedOut: false,
        execError: null,
        skipped: false,
      },
    );

    assert.strictEqual(result.status, 0);
    assert.match(result.stdout, /All probes match/);
    assert.strictEqual(result.stderr, "");
  });
});

function recordConfig(config) {
  const dir = mkdtempSync(join(tmpdir(), "clifingerprint-invalid-"));
  const configPath = join(dir, "probes.json");
  const outputPath = join(dir, "fingerprint.json");
  writeFileSync(configPath, JSON.stringify(config));

  const result = spawnSync(
    process.execPath,
    ["src/cli.js", "record", configPath, "--output", outputPath],
    {
      encoding: "utf8",
    },
  );
  return { ...result, outputExists: existsSync(outputPath) };
}

function compareConfig(config, baselineProbe) {
  const dir = mkdtempSync(join(tmpdir(), "clifingerprint-compare-"));
  const configPath = join(dir, "probes.json");
  const baselinePath = join(dir, "fingerprint.json");
  writeFileSync(configPath, JSON.stringify(config));
  writeFileSync(
    baselinePath,
    JSON.stringify({
      version: 1,
      tool: config.tool,
      metadata: {},
      package: null,
      timestamp: "2026-01-01T00:00:00.000Z",
      probes: [baselineProbe],
    }),
  );

  return spawnSync(process.execPath, ["src/cli.js", "compare", baselinePath, configPath], {
    encoding: "utf8",
  });
}
