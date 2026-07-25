import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { runProbe } from "../src/fingerprint/executor.js";

describe("executor", () => {
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

  it("should respect timeout", async () => {
    const result = await runProbe({
      name: "timeout",
      tool: "sleep",
      args: ["30"],
      timeoutMs: 100,
    });
    assert.strictEqual(result.timedOut, true);
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
    assert.strictEqual(
      result.command,
      'bash fixtures/greeter.sh --loud "Probe User"',
    );
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
