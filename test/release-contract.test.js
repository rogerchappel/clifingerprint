import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const verifier = fileURLToPath(new URL("../scripts/verify-release-tag.mjs", import.meta.url));
const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const expectedTag = `v${packageJson.version}`;

function verify(refName) {
  const env = { ...process.env };
  if (refName === undefined) delete env.GITHUB_REF_NAME;
  else env.GITHUB_REF_NAME = refName;
  return spawnSync(process.execPath, [verifier], { encoding: "utf8", env });
}

describe("release tag contract", () => {
  it("tests the declared minimum Node runtime in CI", () => {
    const workflow = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
    const minimum = packageJson.engines.node.match(/^>=(\d+\.\d+\.\d+)$/)?.[1];

    assert.ok(minimum, "engines.node must declare one exact minimum version");
    assert.ok(workflow.includes(`node-version: [${minimum},`));
    assert.match(workflow, /npm run package:smoke/);
  });

  it("accepts the exact v-prefixed package version", () => {
    const result = verify(expectedTag);
    assert.equal(result.status, 0);
    assert.match(result.stdout, new RegExp(`matches package version ${packageJson.version}`));
  });

  it("rejects a mismatching tag", () => {
    const mismatchedTag = `${expectedTag}-mismatch`;
    const result = verify(mismatchedTag);
    assert.equal(result.status, 1);
    assert.match(result.stderr, new RegExp(`expected ${expectedTag}.*received ${mismatchedTag}`));
  });

  it("rejects a missing tag", () => {
    const result = verify(undefined);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /GITHUB_REF_NAME is not set/);
  });

  it("runs tag verification before artifact creation", () => {
    const workflow = readFileSync(
      new URL("../.github/workflows/release.yml", import.meta.url),
      "utf8",
    );
    const verifyIndex = workflow.indexOf("npm run release:verify-tag");
    const packIndex = workflow.indexOf("npm pack");
    const releaseIndex = workflow.indexOf("gh release create");

    assert.ok(verifyIndex >= 0, "release workflow must invoke the tag verifier");
    assert.ok(verifyIndex < packIndex, "tag verifier must run before npm pack");
    assert.ok(verifyIndex < releaseIndex, "tag verifier must run before release creation");
  });
});
