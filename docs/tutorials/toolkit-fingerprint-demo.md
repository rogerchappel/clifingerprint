# Toolkit Fingerprint Demo

This recipe records and compares the command contract of the `fixtures/toolkit.sh`
CLI fixture. It is designed as a small CI-friendly flow for maintainers who want
to notice changed help text, exit codes, or subcommands before release.

## Run the demo

```sh
npm install
bash demo/run-toolkit-fingerprint.sh
```

The script writes `.tmp/toolkit-fingerprint-demo/toolkit-fingerprint.json`,
prints a summary, and compares a fresh run against that recorded baseline.

## What the fixture covers

`fixtures/toolkit-probes.json` records six probes:

- `--version`
- `--help`
- `init`
- `build`
- `serve`
- an unknown `deploy` subcommand expected to exit with code `2`

## CI Pattern

Commit a known-good fingerprint for your CLI, then run `compare` during release
checks. If the command contract changed, review the output and decide whether to
update the baseline or fix the regression.

## Guardrails

- clifingerprint runs the configured commands, so probe only commands that are
  safe in CI.
- A changed fingerprint is not automatically bad; it is a review signal.
- The fixture is local and deterministic, but real CLIs may need pinned env vars
  or stable working directories for repeatable output.
