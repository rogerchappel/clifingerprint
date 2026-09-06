import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runProbe, truncate } from "../src/fingerprint/executor.js";

describe("executor", () => {
  it("should leave output at the exact UTF-8 byte limit unchanged", () => {
    assert.strictEqual(truncate("Aé", 3), "Aé");
  });

  it("should truncate ASCII output at the byte limit", () => {
    assert.strictEqual(truncate("abcd", 3), "abc\n... [truncated, 4 bytes total]");
  });

  it("should preserve complete multibyte characters within the byte limit", () => {
    assert.strictEqual(truncate("😀😀", 4), "😀\n... [truncated, 8 bytes total]");
    assert.strictEqual(truncate("😀😀", 5), "😀\n... [truncated, 8 bytes total]");
  });

  it("should keep captured stdout and stderr valid at a multibyte boundary", async () => {
    const result = await runProbe({
      name: "multibyte streams",
      tool: process.execPath,
      args: [
        "-e",
        "process.stdout.write('a'.repeat(4095) + '😀'); process.stderr.write('b'.repeat(4094) + 'éx')",
      ],
    });

    assert.strictEqual(result.stdout, `${"a".repeat(4095)}\n... [truncated, 4099 bytes total]`);
    assert.strictEqual(result.stderr, `${"b".repeat(4094)}é\n... [truncated, 4097 bytes total]`);
    assert.doesNotMatch(result.stdout, /�/);
    assert.doesNotMatch(result.stderr, /�/);
  });

  it("should capture stdout of a simple command", async () => {
    const result = await runProbe({
      name: "echo test",
      tool: "echo",
      args: ["hello"],
    });
    assert.strictEqual(result.exitCode, 0);
    assert.ok(result.stdout.includes("hello"));
    assert.strictEqual(result.stderr, "");
  });

  it("should capture stderr", async () => {
    const result = await runProbe({
      name: "stderr test",
      tool: "bash",
      args: ["-c", "echo 'error message' >&2"],
    });
    assert.strictEqual(result.exitCode, 0);
    assert.ok(result.stderr.includes("error message"));
  });

  it("should capture non-zero exit code", async () => {
    const result = await runProbe({
      name: "exit code 42",
      tool: "bash",
      args: ["-c", "exit 42"],
    });
    assert.strictEqual(result.exitCode, 42);
  });

  it("should handle command not found", async () => {
    const result = await runProbe({
      name: "missing",
      tool: "nonexistent-command-xyz-123",
    });
    assert.strictEqual(result.exitCode, null);
    assert.strictEqual(result.timedOut, false);
    assert.ok(result.execError);
    assert.ok(result.execError.includes("ENOENT"));
  });

  it("should support stdin input", async () => {
    const result = await runProbe({
      name: "stdin",
      tool: "cat",
      stdin: "hello from stdin",
      timeoutMs: 5000,
    });
    assert.ok(result.stdout.includes("hello from stdin"));
  });

  it("should close stdin when an empty string is explicitly supplied", async () => {
    const result = await runProbe({
      name: "empty stdin",
      tool: process.execPath,
      args: ["-e", "process.stdin.once('end', () => console.log('EOF')); process.stdin.resume()"],
      stdin: "",
      timeoutMs: 1000,
    });

    assert.strictEqual(result.timedOut, false);
    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout.trim(), "EOF");
  });

  it("should respect timeout", async () => {
    const result = await runProbe({
      name: "timeout",
      tool: "sleep",
      args: ["30"],
      timeoutMs: 100,
    });
    assert.strictEqual(result.timedOut, true);
    assert.strictEqual(result.exitCode, null);
    assert.strictEqual(result.expectedExitMatched, null);
  });

  it("should terminate descendants before a timed-out probe settles", async () => {
    const directory = await mkdtemp(join(tmpdir(), "clifingerprint-timeout-"));
    const marker = join(directory, "descendant-ran");
    const descendant = `setTimeout(() => require("node:fs").writeFileSync(${JSON.stringify(marker)}, "ran"), 500)`;
    const parent = `require("node:child_process").spawn(process.execPath, ["-e", ${JSON.stringify(descendant)}], { stdio: "ignore" }); setTimeout(() => {}, 30000)`;
    try {
      const result = await runProbe({
        name: "process tree timeout",
        tool: process.execPath,
        args: ["-e", parent],
        timeoutMs: 100,
      });
      assert.strictEqual(result.timedOut, true);
      await new Promise((resolve) => setTimeout(resolve, 700));
      await assert.rejects(access(marker), { code: "ENOENT" });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("should not evaluate expected exit codes for skipped probes", async () => {
    const result = await runProbe({
      name: "skipped",
      tool: "echo",
      skip: true,
      expectedExitCode: 0,
    });
    assert.strictEqual(result.skipped, true);
    assert.strictEqual(result.expectedExitCode, 0);
    assert.strictEqual(result.expectedExitMatched, null);
  });

  it("should respect cwd", async () => {
    const result = await runProbe({
      name: "cwd",
      tool: "pwd",
      cwd: "/tmp",
    });
    assert.strictEqual(result.exitCode, 0);
    assert.ok(result.stdout.includes("/tmp"));
  });

  it("should support env allowlist", async () => {
    const result = await runProbe({
      name: "env",
      tool: "bash",
      args: ["-c", "echo $CLIFP_TEST_VAR"],
      env: { CLIFP_TEST_VAR: "hello-env" },
    });
    assert.ok(result.stdout.includes("hello-env"));
  });

  it("should support command strings and expected exit codes", async () => {
    const result = await runProbe({
      name: "command",
      command: "bash -c",
      args: ["exit 7"],
      expectedExitCode: 7,
    });
    assert.strictEqual(result.command, 'bash -c "exit 7"');
    assert.strictEqual(result.exitCode, 7);
    assert.strictEqual(result.expectedExitMatched, true);
  });

  it("should prepend a multi-word tool's arguments to probe arguments", async () => {
    const result = await runProbe({
      name: "multi-word tool",
      tool: "bash fixtures/greeter.sh",
      args: ["--loud", "Probe User"],
      expectedExitCode: 0,
    });
    assert.strictEqual(result.command, 'bash fixtures/greeter.sh --loud "Probe User"');
    assert.match(result.stdout, /PROBE USER/);
    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.expectedExitMatched, true);
    assert.strictEqual(result.execError, null);
  });

  it("should limit inherited environment to allowlisted keys", async () => {
    const previous = process.env.CLIFP_ALLOWLIST_TEST;
    process.env.CLIFP_ALLOWLIST_TEST = "allowed";
    try {
      const result = await runProbe({
        name: "allowlist",
        tool: "bash",
        args: ["-c", "echo ${CLIFP_ALLOWLIST_TEST:-missing}:${HOME:-missing}"],
        envAllowlist: ["CLIFP_ALLOWLIST_TEST"],
      });
      assert.strictEqual(result.stdout.trim(), "allowed:missing");
    } finally {
      if (previous === undefined) {
        delete process.env.CLIFP_ALLOWLIST_TEST;
      } else {
        process.env.CLIFP_ALLOWLIST_TEST = previous;
      }
    }
  });
});
