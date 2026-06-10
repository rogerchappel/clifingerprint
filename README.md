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

## Record A Fingerprint

```sh
node src/cli.js record clifingerprint.yaml --output fingerprint.json
```

`record` executes every probe in the config and writes a JSON fingerprint.

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

Each probe can override `tool`, `command`, `args`, `cwd`, `env`,
`envAllowlist`, `expectedExitCode`, `timeoutMs`, `stdin`, and `skip`.

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

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting guidance.

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
