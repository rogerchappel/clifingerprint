#!/usr/bin/env node
// stable-cli.js — a fixture CLI that produces consistent output.
// Used to test that clifingerprint correctly records a stable fingerprint.
//
// Usage: node stable-cli.js           → show help
//        node stable-cli.js --help    → show help with --version flag
//        node stable-cli.js --version → print version
//        node stable-cli.js greet     → say hello
//        node stable-cli.js add 1 2   → sum numbers
//        node stable-cli.js fail      → exit with code 1

const args = process.argv.slice(2);

function showHelp() {
  process.stdout.write(`stable-cli v1.0.0

Usage: stable-cli <command> [options]

Commands:
  greet [name]    Say hello to someone
  add <a> <b>     Add two numbers together
  version         Print the current version
  fail            Exit with a non-zero exit code
  help            Show this help message

Options:
  --help, -h      Show help
  --version, -v   Print version
  --format <fmt>  Output format: text, json (default: text)
  --verbose       Enable verbose output
  --quiet         Suppress non-essential output
  --config <path> Path to config file
  --dry-run       Preview changes without applying

Examples:
  stable-cli greet --name World
  stable-cli add 5 10 --format json
  stable-cli --version
  stable-cli help
`);
}

if (args.length === 0) {
  showHelp();
  process.exit(0);
}

const command = args[0];

switch (command) {
  case "--help":
  case "-h":
  case "help":
    showHelp();
    process.exit(0);
    break;

  case "--version":
  case "-v":
  case "version":
    process.stdout.write("1.0.0\n");
    process.exit(0);
    break;

  case "greet": {
    const nameIdx = args.indexOf("--name") + 1 || args.indexOf("-n") + 1;
    const name = nameIdx > 0 && args[nameIdx] ? args[nameIdx] : "World";
    process.stdout.write(`Hello, ${name}!\n`);
    process.exit(0);
    break;
  }

  case "add": {
    const a = parseFloat(args[1]) ?? NaN;
    const b = parseFloat(args[2]) ?? NaN;
    if (isNaN(a) || isNaN(b)) {
      process.stderr.write("Error: add requires two number arguments\n");
      process.exit(1);
    }
    process.stdout.write(`${a + b}\n`);
    process.exit(0);
    break;
  }

  case "fail":
    process.stderr.write("Intentional failure for testing\n");
    process.exit(1);
    break;

  default:
    process.stderr.write(`Unknown command: ${command}\n`);
    process.exit(1);
    break;
}
