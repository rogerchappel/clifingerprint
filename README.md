# clifingerprint

Local-first CLI contract recording and comparison.

`clifingerprint` runs configured command probes, records the observable CLI
contract, and compares fresh runs against a saved baseline. It is meant for
maintainers who want release checks for help text, options, examples, exit
codes, stdout/stderr snippets, and package metadata.

## Install

```sh
npm install
```

Run from the repository:

```sh
node src/cli.js --help
```

The package exposes the `cli-fp` binary when installed.

## Quick Start: Record A Fingerprint

```sh
node src/cli.js record clifingerprint.yaml --output fingerprint.json
```

`record` executes every non-skipped probe in the config and writes a JSON
fingerprint. Intentionally skipped probes remain in the fingerprint, and their
expected exit code is not evaluated. It exits with code `1` without saving when
a command cannot be executed, a probe times out, or a completed probe does not
match its `expectedExitCode`.

## Compare Against A Baseline

```sh
node src/cli.js compare fingerprint.json clifingerprint.yaml
```

`compare` runs the probes again and exits with code `1` when the current
contract differs from the baseline.

## Show A Summary

```sh
node src/cli.js show fingerprint.json
```

## Config

Configs may be JSON or YAML:

```yaml
tool: "bash fixtures/greeter.sh"
packageFile: "package.json"
metadata:
  owner: cli-team
envAllowlist:
  - PATH
probes:
  - name: help
    args: ["--help"]
    expectedExitCode: 0
  - name: unknown command
    args: ["deploy"]
    expectedExitCode: 2
```

Global defaults and individual probes accept `args` as an array of strings,
`cwd` and `stdin` as strings, and `skip` as a boolean. Each probe can override
those defaults as well as `tool`, `command`, `env`, `envAllowlist`,
`expectedExitCode`, and `timeoutMs`.
Set `skip: true` to retain a probe in the contract without executing it;
`expectedExitMatched` is `null` for that probe even when `expectedExitCode` is
configured. A probe that exceeds `timeoutMs` is never saved as a baseline by
the `record` command.

## Verify

```sh
npm test
npm run lint
npm run build
npm run smoke
npm run release:check
bash scripts/validate.sh
```

`scripts/smoke.sh` performs a real CLI record and compare flow against the
fixture CLIs.

`npm run package:smoke` verifies the packed artifact includes the CLI entry,
README, license, changelog, security policy, contributing guide, and code of
conduct before a release candidate is reviewed.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting guidance.

## Limitations

- `clifingerprint` records observable CLI behavior from configured probes; it
  does not infer undocumented compatibility guarantees.
- Probe output can include sensitive local paths or values if the configured
  command prints them. Review baselines before committing or sharing them.
- Comparisons are deterministic snapshots, not semantic reviews. A changed help
  line, exit code, or metadata field should be reviewed by a maintainer before
  being accepted as intentional.

## Development

Use Node.js 20 or newer. Run the same checks locally before opening a PR:

```sh
npm run build
npm run check
npm run lint
npm test
npm run smoke
npm run package:smoke
npm run release:check
```

## License

MIT

## Release verification

Run the same checks locally before opening a release PR:

```bash
npm run check
npm test
npm run build
npm run smoke
npm run package:smoke
npm run release:check
```
