#!/usr/bin/env bash
set -euo pipefail

# Smoke test: quick integration check that the CLI is functional
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

echo "Running smoke tests for clifingerprint..."

# Test 1: CLI can start and show help
if node src/cli.js --help | grep -q "cli-fp"; then
  echo "PASS: CLI help works"
else
  echo "FAIL: CLI help failed"
  exit 1
fi

# Test 2: Record command works with fixture
if node src/cli.js record fixtures/greeter-probes.json --output /tmp/smoke-test-fp.json 2>&1 | grep -q "Fingerprint saved"; then
  echo "PASS: Record command works"
  rm -f /tmp/smoke-test-fp.json
else
  echo "FAIL: Record command failed"
  exit 1
fi

# Test 3: Fingerprint file is valid JSON
record_result=$(node src/cli.js record fixtures/greeter-probes.json --output /tmp/smoke-test-fp2.json 2>&1)
if echo "$record_result" | grep -q "Fingerprint saved" && [ -f /tmp/smoke-test-fp2.json ] && node -e "JSON.parse(require('fs').readFileSync('/tmp/smoke-test-fp2.json','utf8'))"; then
  echo "PASS: Fingerprint is valid JSON"
  rm -f /tmp/smoke-test-fp2.json
else
  echo "FAIL: Fingerprint is not valid JSON"
  exit 1
fi

# Test 4: Compare command works (compare fingerprint to itself)
node src/cli.js record fixtures/greeter-probes.json --output /tmp/smoke-fp1.json
node src/cli.js record fixtures/greeter-probes.json --output /tmp/smoke-fp2.json
compare_result=$(node src/cli.js compare /tmp/smoke-fp1.json fixtures/greeter-probes.json 2>&1)
if echo "$compare_result" | grep -q "match"; then
  echo "PASS: Compare command works (fresh run matches baseline)"
else
  echo "FAIL: Compare command failed"
  exit 1
fi

rm -f /tmp/smoke-fp1.json /tmp/smoke-fp2.json

echo "All smoke tests passed!"
