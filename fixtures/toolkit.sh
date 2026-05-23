#!/usr/bin/env bash
# Multi-subcommand toolkit for testing
set -euo pipefail

case "${1:-}" in
  --version)
    echo "toolkit 2.1.0"
    exit 0
    ;;
  --help)
    echo "Usage: toolkit <command> [options]"
    echo ""
    echo "Commands:"
    echo "  init    Initialize a new project"
    echo "  build   Build the project"
    echo "  serve   Start development server"
    echo "  --help  Show this help"
    exit 0
    ;;
  init)
    echo "Project initialized."
    exit 0
    ;;
  build)
    echo "Build successful."
    exit 0
    ;;
  serve)
    echo "Server running on http://localhost:3000"
    exit 0
    ;;
  *)
    echo "Error: Unknown command '${1:-}'" >&2
    echo "Run 'toolkit --help' for usage." >&2
    exit 2
    ;;
esac
