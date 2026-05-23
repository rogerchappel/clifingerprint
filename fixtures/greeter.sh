#!/usr/bin/env bash
# Simple greeting CLI for testing
set -euo pipefail

case "${1:-}" in
  --version)
    echo "greeter 1.0.0"
    exit 0
    ;;
  --help)
    echo "Usage: greeter [options] [name]"
    echo ""
    echo "Options:"
    echo "  --version    Show version"
    echo "  --help       Show this help"
    echo "  --loud       SHOUT the greeting"
    echo "  --lang LANG  Language (en, es, fr)"
    echo ""
    echo "Examples:"
    echo "  greeter World"
    echo "  greeter --loud World"
    exit 0
    ;;
esac

NAME="${1:-World}"

LLOUD=false
LANG=en

while [[ $# -gt 0 ]]; do
  case "$1" in
    --loud) LLOUD=true; shift ;;
    --lang) LANG="${2:-en}"; shift 2 ;;
    *) NAME="$1"; shift ;;
  esac
done

GREET="Hello, $NAME!"

if [ "$LLOUD" = true ]; then
  GREET=$(echo "$GREET" | tr '[:lower:]' '[:upper:]')
fi

echo "$GREET"
