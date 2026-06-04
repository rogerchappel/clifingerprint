# Video brief: "Catch CLI breaking changes in CI — clifingerprint demo"

## Target
- Length: 2–3 minute screen-cast
- Audience: CLI tool maintainers, OSS devs, CI/CD engineers

## Hook (first 5 seconds)
- Terminal diff showing a CLI's --help output changing between versions with no test catching it
- Voiceover/text: "Your CLI changed in production and nobody noticed."

## Demo flow (screen recording)

1. Show a simple CLI tool (the greeter fixture in the repo)
2. Record a fingerprint:
   ```sh
   npx cli-fp record clifingerprint.yaml --output fingerprint.json
   ```
3. Show the fingerprint JSON — exit codes, stdout snippets, durations
4. Change the greeter.sh (rename --loud to --shout)
5. Compare:
   ```sh
   npx cli-fp compare fingerprint.json clifingerprint.yaml
   ```
6. Show the diff report in the terminal — highlighted delta
7. Wire it into a GitHub Actions YAML snippet

## Key talking points
- No network calls, no hosted backend
- Pure file-based comparison — deterministic
- Works for any CLI that prints to stdout/stderr
- Catches: exit code drift, help text changes, missing flags

## File references (all exist in repo)
- `src/cli.js` — the CLI entry point
- `clifingerprint.yaml` — probe config
- `fixtures/greeter.sh` — example CLI fixture
- `src/fingerprint/builder.js` — the fingerprint builder
- `examples/ci-release-check.sh` — CI script (new)
- `docs/tutorials/ci-release-check.md` — tutorial (new)

## Call to action
- "npm install clifingerprint" or clone the repo
- PRs welcome — small, fixture-backed changes easiest to review
- Run `npm run smoke` to verify locally

## What NOT to say
- Don't claim adoption numbers (none available)
- Don't say it works with every possible CLI — scope to stdout/stderr CLIs
- Don't call it a testing framework — it's a contract recorder
