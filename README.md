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
contract differs from the baseline. A fresh execution error, timeout, or
`expectedExitCode` mismatch also fails comparison even when the saved baseline
contains the same failure state, preventing broken probes from being reported
as compatible.

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
When a probe times out, `clifingerprint` terminates its complete process tree
before returning the result. POSIX systems use an isolated process group;
Windows uses the built-in `taskkill /t /f` command. If process-tree termination
is denied, cleanup may be limited to the direct probe process.
The global `tool` and every probe `name` must be nonblank. Probe names must also
be unique because they identify probes during comparison. When supplied, a
probe-level `tool` or `command` must be nonblank too.
Set `skip: true` to retain a probe in the contract without executing it;
`expectedExitMatched` is `null` for that probe even when `expectedExitCode` is
configured. A probe that exceeds `timeoutMs` is never saved as a baseline by
the `record` command.

Relative command paths and arguments are evaluated from the directory that
contains the JSON or YAML config. A relative `cwd` is resolved from that same
directory, then becomes the working directory for the probe; relative command
arguments are therefore evaluated from the resolved `cwd`. `packageFile` is
also config-relative. Pass `--tool-dir <dir>` to make that directory the base
for probe paths, relative `cwd` values, and `packageFile` instead. Absolute
paths are used unchanged. This means an absolute config path can be recorded
reliably from any working directory:

```sh
cli-fp record /path/to/project/clifingerprint.yaml --output fingerprint.json
```

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

Use Node.js 20.19 or newer. CI runs the full release check on Node 20.19, the
minimum declared in `package.json`, and on Node 22. Run the same checks locally
before opening a PR:

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

Maintainer releases are created by pushing a tag that exactly matches the
version in `package.json`, prefixed with `v` (for example, package version
`0.1.0` requires tag `v0.1.0`). The tag workflow runs
`npm run release:verify-tag` before `npm pack` or GitHub release creation and
stops without creating artifacts when the tag is missing or mismatched.
