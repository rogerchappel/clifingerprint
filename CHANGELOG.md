# Changelog

All notable changes to this project will be documented in this file.

This project follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
format and uses semantic versioning when versioned releases are published.

## [Unreleased]

### Added

- Initial project setup.

### Fixed

- Close explicitly configured empty stdin streams so EOF-waiting probes can
  complete and be recorded.
- Resolve CLI metadata from decoded file URLs so installed commands work from
  paths containing spaces.
- Truncate captured stdout and stderr at complete UTF-8 character boundaries
  and report their actual byte counts.
- Execute arguments embedded in `tool` before per-probe arguments, and reject
  recordings whose probes fail to execute or miss their expected exit code.

## Release Links

- Unreleased:
  `https://github.com/rogerchappel/clifingerprint/compare/...HEAD`
- Latest release:
  `https://github.com/rogerchappel/clifingerprint/releases/latest`

Replace placeholder links once the first release tag exists.
