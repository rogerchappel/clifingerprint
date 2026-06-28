# clifingerprint Social Hooks

Grounded draft posts for the toolkit fixture demo.

## Hooks

1. `clifingerprint` records the observable contract of a CLI: command output,
   stderr, exit codes, durations, and package metadata.
2. The new toolkit demo records six probes, prints a summary, and compares a
   fresh run against the recorded baseline.
3. CLI releases often break at the edges: changed help text, renamed flags, or
   unexpected exit codes. `clifingerprint compare` turns those changes into a
   reviewable release signal.
4. Start small: fingerprint `--help`, `--version`, one happy-path subcommand,
   and one expected failure.

## Demo CTA

```sh
npm install
bash demo/run-toolkit-fingerprint.sh
```

## Video Beats

1. Open `fixtures/toolkit.sh` and `fixtures/toolkit-probes.json`.
2. Run the toolkit demo script.
3. Show the generated fingerprint JSON.
4. Run `compare` and point to the matching baseline result.
5. Explain that intentional CLI changes should update the saved baseline.

## Guardrails

- Do not describe clifingerprint as a full test framework.
- Do not claim it can judge whether a changed contract is good or bad.
- Keep safety advice explicit: probes execute commands, so keep them CI-safe.
