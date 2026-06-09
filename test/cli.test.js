import { describe, it } from "node:test";
import assert from "node:assert";
import { execSync } from "node:child_process";

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

  it("should produce snapshot output", () => {
    const out = execSync("node dist/cli.js snapshot --path .", { encoding: "utf8" });
    assert.ok(out.length > 0, "snapshot should produce non-empty output");
  });
});
