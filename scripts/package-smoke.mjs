#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const output = execFileSync("npm", ["pack", "--dry-run", "--json"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"],
});

const [packument] = JSON.parse(output);
const packedFiles = new Set(packument.files.map((file) => file.path));
const requiredFiles = new Set([
  "README.md",
  "LICENSE",
  "SECURITY.md",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "clifingerprint.yaml",
  "fixtures/greeter.sh",
  "fixtures/greeter-probes.json",
  "examples/ci-release-check.sh",
  "docs/tutorials/ci-release-check.md",
]);

if (packageJson.main) {
  requiredFiles.add(packageJson.main.replace(/^\.\//, ""));
}

const binEntries =
  typeof packageJson.bin === "string"
    ? [packageJson.bin]
    : Object.values(packageJson.bin ?? {});

for (const binEntry of binEntries) {
  requiredFiles.add(binEntry.replace(/^\.\//, ""));
}

const missing = [...requiredFiles].filter((file) => !packedFiles.has(file));

if (missing.length > 0) {
  console.error(`${packageJson.name} package smoke failed; missing packed file(s):`);
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

const smokeDir = mkdtempSync(join(tmpdir(), `${packageJson.name} package smoke `));

try {
  const packOutput = execFileSync("npm", ["pack", "--pack-destination", smokeDir, "--json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  const [packedPackage] = JSON.parse(packOutput);
  const tarball = join(smokeDir, packedPackage.filename);
  const installDir = join(smokeDir, "installed package");

  execFileSync("npm", ["install", "--prefix", installDir, "--ignore-scripts", tarball], {
    stdio: ["ignore", "ignore", "inherit"],
  });

  const cli =
    process.platform === "win32"
      ? join(installDir, "node_modules", ".bin", "cli-fp.cmd")
      : join(installDir, "node_modules", ".bin", "cli-fp");
  const help = execFileSync(cli, ["--help"], { encoding: "utf8" });
  const version = execFileSync(cli, ["--version"], { encoding: "utf8" }).trim();

  if (!help.includes("Record CLI contracts") || version !== packageJson.version) {
    throw new Error("installed CLI returned unexpected help or version output");
  }
} finally {
  rmSync(smokeDir, { recursive: true, force: true });
}

console.log(
  `${packageJson.name} package smoke passed with ${packument.files.length} packed file(s) and an installed CLI check.`,
);
