# CLIFingerprint Tasks

## Phase 1: Foundation

- [x] Scaffold project with StackForge
- [x] Set up package.json with dependencies
- [x] Configure ESLint and Prettier
- [x] Create CLI entry point (index.js)
- [x] Write PRD.md

## Phase 2: Core Engine

- [x] Build probe config loader (YAML/JSON)
- [x] Build command recorder (capture exit code, stdout, stderr)
- [x] Build baseline save/load (JSON storage)
- [x] Build comparison engine (diff fingerprints)
- [x] Build reporter (human-readable diff output)

## Phase 3: CLI Interface

- [x] `record` command: run probes and save fingerprint
- [x] `check` command: compare current run with saved baseline
- [x] `baseline` command: save/update baseline
- [x] Global options: --config, --output, --verbose

## Phase 4: Test Fixtures

- [x] Create stable fixture CLI (no changes expected)
- [x] Create versioned fixture CLI (changes between versions)
- [x] Create test suite covering all core features

## Phase 5: Quality Gates

- [x] Lint and format
- [x] Test suite passing
- [x] Validate.sh checks
- [x] Release checks
- [x] Release notes

## Phase 6: Publication

- [x] Push to GitHub
- [x] Main branch protection
- [x] Release candidate PR
