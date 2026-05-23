# CLIFingerprint PRD

Status: in-progress
Decision: selected for factory build on 2026-05-23

## Summary

CLIFingerprint records the observable contract of a command line tool: commands, options, examples, exit codes, stdout/stderr snippets, and package metadata. It lets maintainers compare a new build against a saved baseline before surprising users or agents.

## Problem

CLI changes are easy to make accidentally and hard to notice in reviews. Agentic workflows rely on stable help text, flags, and exit codes, but most projects only test happy-path output.

## Users

- CLI maintainers preparing releases.
- Agents that need stable command contracts.
- Developers reviewing generated or refactored command surfaces.

## MVP

- CLI command to run configured command probes and save a fingerprint.
- CLI command to compare a fresh run with a baseline.
- YAML/JSON probe config with command, args, cwd, env allowlist, and expected exit.
- Diff report that highlights changed help text, missing flags, exit-code drift, and package metadata changes.
- Fixtures for stable and breaking CLI changes.

## Non-goals

- Full terminal emulation.
- Networked telemetry.
- Golden-file management for arbitrary binary output.

## Source Attribution

Inspired by approval testing, snapshot testing, and command contract docs used in tools like Cobra and Commander projects. Reframed as a standalone local-first CLI contract recorder.

