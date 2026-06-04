#!/usr/bin/env bash
# clifingerprint — CI release check example
#
# Run this in a CI job (or locally) before cutting a release.
# It records a fresh fingerprint of your CLI, compares it
# against the saved baseline from the repo, and fails if
# anything changed.
#
# Usage:
#   bash examples/ci-release-check.sh
#
set -euo pipefail

BASELINE="fingerprint.json"
CONFIG="clifingerprint.yaml"

# Record a fresh fingerprint
echo "▸ Recording fresh fingerprint against $CONFIG ..."
node src/cli.js record "$CONFIG" --output "$BASELINE"

# Compare against the saved baseline in .github/fingerprints/
SAVED=".github/fingerprints/fingerprint-main.json"
if [ -f "$SAVED" ]; then
  echo "▸ Comparing against saved baseline $SAVED ..."
  if node src/cli.js compare "$BASELINE" "$CONFIG"; then
    echo "✓ CLI contract unchanged — safe to release."
  else
    echo "✗ CLI contract changed! Review the diff above."
    echo ""
    echo "  If the change is intentional, update the saved baseline:"
    echo "    cp $BASELINE $SAVED"
    echo "  Then commit and push."
    exit 1
  fi
else
  echo "⚠ No saved baseline found at $SAVED — this is probably the first release."
  echo "  Copy the fingerprint to lock it in:"
  echo "    mkdir -p .github/fingerprints && cp $BASELINE $SAVED"
  echo "  Then commit and push."
fi
