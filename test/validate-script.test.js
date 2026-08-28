import assert from "node:assert/strict";
import { chmod, cp, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";

test("validator honors the declared npm package manager when pnpm is also available", async () => {
  const root = await mkdtemp(join(tmpdir(), "clifingerprint-validate-"));
  await mkdir(join(root, "scripts"));
  await mkdir(join(root, ".github"));
  await mkdir(join(root, "docs"));
  await cp(new URL("../scripts/validate.sh", import.meta.url), join(root, "scripts/validate.sh"));

  for (const file of [
    "README.md",
    "AGENTS.md",
    "CONTRIBUTING.md",
    "SECURITY.md",
    ".github/pull_request_template.md",
  ]) {
    await mkdir(join(root, file, ".."), { recursive: true });
    await writeFile(join(root, file), "fixture\n");
  }
  await writeFile(
    join(root, "package.json"),
    JSON.stringify({ packageManager: "npm@10.9.4", scripts: { test: "fixture" } }),
  );
  await writeFile(join(root, "package-lock.json"), "{}\n");
  await writeFile(join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");

  const bin = join(root, "bin");
  const log = join(root, "manager.log");
  await mkdir(bin);
  for (const manager of ["npm", "pnpm"]) {
    const executable = join(bin, manager);
    await writeFile(executable, `#!/bin/sh\nprintf '${manager}\\n' >> "$MANAGER_LOG"\n`);
    await chmod(executable, 0o755);
  }

  const output = execFileSync("bash", ["scripts/validate.sh"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, MANAGER_LOG: log },
  });

  assert.match(output, /NOTE: using package manager: npm/);
  assert.equal(await readFile(log, "utf8"), "npm\n");
});
