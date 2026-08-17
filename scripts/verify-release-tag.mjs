#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const refName = process.env.GITHUB_REF_NAME;

if (!refName) {
  console.error("Release tag verification failed: GITHUB_REF_NAME is not set.");
  process.exit(1);
}

const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const expectedTag = `v${packageJson.version}`;

if (refName !== expectedTag) {
  console.error(
    `Release tag verification failed: expected ${expectedTag} for package version ${packageJson.version}, received ${refName}.`,
  );
  process.exit(1);
}

console.log(`Release tag ${refName} matches package version ${packageJson.version}.`);
