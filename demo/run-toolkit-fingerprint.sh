#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.tmp/toolkit-fingerprint-demo"

mkdir -p "$OUT"

cd "$ROOT"

echo "== record toolkit fixture fingerprint =="
node src/cli.js record fixtures/toolkit-probes.json --output "$OUT/toolkit-fingerprint.json"

echo
echo "== summarize recorded contract =="
node src/cli.js show "$OUT/toolkit-fingerprint.json"

echo
echo "== compare fresh run against recorded baseline =="
node src/cli.js compare "$OUT/toolkit-fingerprint.json" fixtures/toolkit-probes.json

node -e "const fs=require('node:fs'); const data=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); console.log({tool:data.tool, probes:data.probes.length}); if (data.probes.length !== 6) process.exit(1);" "$OUT/toolkit-fingerprint.json"

echo
echo "Demo fingerprint written to $OUT/toolkit-fingerprint.json"
