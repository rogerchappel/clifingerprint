import assert from "node:assert/strict";
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
});
