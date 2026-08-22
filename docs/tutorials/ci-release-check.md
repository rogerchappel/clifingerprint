# Catch CLI regressions in CI with clifingerprint

This tutorial shows how to wire `clifingerprint` into a GitHub Actions release
check so that every pull request fails when the CLI contract changes.

## Prerequisites

- A CLI tool with `--help` / `--version` / subcommands
- Node.js 20.19+
- `clifingerprint` installed or run from source

## Step 1 — Create a probe config

Write `clifingerprint.yaml`:

```yaml
tool: "node dist/cli.js"
packageFile: "package.json"

probes:
  - name: help
    args: ["--help"]
    expectedExitCode: 0

  - name: version
    args: ["--version"]
    expectedExitCode: 0

  - name: unknown-subcommand
    args: ["unknown"]
    expectedExitCode: 1
```

## Step 2 — Record the baseline

```sh
npm run build
npx cli-fp record clifingerprint.yaml --output .github/fingerprints/fingerprint-main.json
```

Commit `fingerprint-main.json`.

## Step 3 — Add CI check

Use the example script:

```yaml
# .github/workflows/release-check.yml
- name: Record fresh fingerprint
  run: npm run build && npx cli-fp record clifingerprint.yaml
- name: Compare against baseline
  run: npx cli-fp compare .github/fingerprints/fingerprint-main.json clifingerprint.yaml
```

## Why this matters

Without `clifingerprint`, a CLI can quietly change:
- exit codes (breaking scripts that parse them)
- help text spelling or flag names
- subcommand availability
- error message format

This check turns those drift issues into immediate CI failures.
