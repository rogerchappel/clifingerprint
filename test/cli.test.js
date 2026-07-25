import { describe, it } from "node:test";
import assert from "node:assert";
import { execSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
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
    writeFileSync(
      configPath,
      JSON.stringify({
        tool: "node",
        probes: [
          {
            name: "version",
            args: ["test/fixtures/stable-cli.js", "--version"],
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
});

function recordConfig(config) {
  const dir = mkdtempSync(join(tmpdir(), "clifingerprint-invalid-"));
  const configPath = join(dir, "probes.json");
  const outputPath = join(dir, "fingerprint.json");
  writeFileSync(configPath, JSON.stringify(config));

  return spawnSync(
    process.execPath,
    ["src/cli.js", "record", configPath, "--output", outputPath],
    { encoding: "utf8" },
  );
}
