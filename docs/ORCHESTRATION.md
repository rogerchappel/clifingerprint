# CLIFingerprint Orchestration

## Overview

CLIFingerprint is a CLI contract recorder that captures the observable surface of command-line tools. It runs configured probes against a target CLI and records a fingerprint that can be compared across versions.

## Architecture

### Core Components

1. **Config Loader** (`src/config.js`)
   - Loads probe definitions from YAML or JSON
   - Validates required fields (id, command, args)
   - Supports environment variable allowlists

2. **Recorder** (`src/recorder.js`)
   - Spawns child processes for each probe
   - Captures stdout, stderr, exit code
   - Builds a fingerprint record per probe

3. **Baseline Storage** (`src/baselines.js`)
   - Saves fingerprints to `.clifingerprint/baseline.json`
   - Supports multiple baselines by name
   - Tracks metadata (timestamp, version, hash)

4. **Compare Engine** (`src/compare.js`)
   - Diffs two fingerprint sets
   - Identifies: new commands, removed commands, changed help text, exit code drift, flag changes

5. **Reporter** (`src/reporter.js`)
   - Human-readable diff output
   - Supports JSON output for CI integration
   - Exit codes: 0 = match, 1 = differences found

### CLI Commands

```
clifingerprint record   -- Run all probes and save fingerprint
clifingerprint check    -- Compare current run against baseline
clifingerprint baseline -- Save fingerprint as named baseline
clifingerprint diff     -- Show diff between two saved fingerprints
```

## Execution Model

```
1. Load config → 2. Run probes (parallel) → 3. Collect results → 4. Build fingerprint → 5. Save/compare
```

Each probe runs as a separate child process. Timeout configurable per probe (default 30s). Stdout/stderr captured up to 8KB each to prevent memory issues.

## Testing

Uses Node.js built-in test runner (`node --test`). Test fixtures are in `test/fixtures/`:
- `stable-cli.js` - CLI that produces consistent output
- `changing-cli.js` - CLI that changes behavior based on environment variable
