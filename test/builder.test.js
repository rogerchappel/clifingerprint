import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildFingerprint } from "../src/fingerprint/builder.js";
import { loadConfig } from "../src/fingerprint/config.js";

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

  for (const extension of ["yaml", "json"]) {
    it(`should resolve ${extension.toUpperCase()} probe paths from the config directory`, async () => {
      const configDir = mkdtempSync(join(tmpdir(), "cli fingerprint config paths "));
      mkdirSync(join(configDir, "working dir"));
      writeFileSync(
        join(configDir, "working dir", "probe script.js"),
        "console.log(process.cwd()); console.log(process.argv[2]);\n",
      );
      writeFileSync(join(configDir, "package file.json"), JSON.stringify({ name: "fixture-pkg" }));
      const config = {
        tool: process.execPath,
        packageFile: "package file.json",
        cwd: "working dir",
        probes: [{ name: "paths", args: ["probe script.js", "argument value"] }],
      };
      const configPath = join(configDir, `probe config.${extension}`);
      writeFileSync(
        configPath,
        extension === "json"
          ? JSON.stringify(config)
          : `tool: ${JSON.stringify(process.execPath)}\npackageFile: package file.json\ncwd: working dir\nprobes:\n  - name: paths\n    args:\n      - probe script.js\n      - argument value\n`,
      );

      const fp = await buildFingerprint(loadConfig(configPath));
      assert.strictEqual(fp.package.name, "fixture-pkg");
      assert.strictEqual(fp.probes[0].exitCode, 0);
      assert.ok(fp.probes[0].stdout.includes(join(configDir, "working dir")));
      assert.ok(fp.probes[0].stdout.includes("argument value"));
    });
  }

  it("should give an explicit tool directory precedence over the config directory", async () => {
    const configDir = mkdtempSync(join(tmpdir(), "cli-fp-config-"));
    const toolDir = mkdtempSync(join(tmpdir(), "cli fp tool dir "));
    writeFileSync(join(toolDir, "probe.js"), "console.log('tool-dir');\n");
    writeFileSync(join(toolDir, "package.json"), JSON.stringify({ name: "tool-dir-package" }));

    const fp = await buildFingerprint(
      {
        configDir,
        tool: process.execPath,
        packageFile: "package.json",
        probes: [{ name: "precedence", args: ["probe.js"] }],
      },
      toolDir,
    );

    assert.strictEqual(fp.package.name, "tool-dir-package");
    assert.strictEqual(fp.probes[0].stdout.trim(), "tool-dir");
  });
});
