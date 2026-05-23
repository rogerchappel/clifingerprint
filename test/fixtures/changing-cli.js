#!/usr/bin/env node
// changing-cli.js — a fixture CLI that changes behavior based on CLIFINGERPRINT_VERSION env var.
// CLIFINGERPRINT_VERSION=v1 (default) produces one behavior.
// CLIFINGERPRINT_VERSION=v2 changes flags and commands.
// Used to test change detection.

const version = process.env.CLIFINGERPRINT_VERSION || "v1";
const args = process.argv.slice(2);

function showHelpV1() {
  process.stdout.write(`changing-cli v1.0.0

Usage: changing-cli <command>

Commands:
  version         Print version
  echo <text>     Echo the given text
  count           Count words from stdin
  --format <f>    Output format (text, json)

Options:
  --help, -h      Show help
  --verbose       Verbose output
  --debug         Debug mode
`);
}

function showHelpV2() {
  // v2 is a BREAKING change: different flags, removed --debug, renamed echo → print
  process.stdout.write(`changing-cli v2.0.0

Usage: changing-cli <command>

Commands:
  version         Print version
  print <text>    Print the given text (renamed from echo)
  summarize       Summarize input (replaces count)
  export <path>   NEW: export data to path
  --format <f>    Output format (text, json, yaml)

Options:
  --help, -h      Show help
  --verbose       Verbose output
  --color         NEW: colored output (replaces --debug)
`);
}

if (args.length === 0) {
  version === "v2" ? showHelpV2 : showHelpV1();
  process.exit(0);
}

const command = args[0];

switch (command) {
  case "--help":
  case "-h":
  case "help":
    version === "v2" ? showHelpV2() : showHelpV1();
    process.exit(0);
    break;

  case "--version":
  case "-v":
  case "version":
    process.stdout.write(version === "v2" ? "2.0.0\n" : "1.0.0\n");
    process.exit(0);
    break;

  case "echo":
    if (version === "v2") {
      process.stderr.write("Error: unknown command 'echo'. Did you mean 'print'?\n");
      process.exit(1);
    }
    process.stdout.write(`${args.slice(1).join(" ")}\n`);
    process.exit(0);
    break;

  case "print":
    if (version === "v1") {
      process.stderr.write("Error: unknown command 'print'\n");
      process.exit(1);
    }
    process.stdout.write(`${args.slice(1).join(" ")}\n`);
    process.exit(0);
    break;

  case "count":
    if (version === "v2") {
      process.stderr.write("Error: unknown command 'count'. Use 'summarize' instead.\n");
      process.exit(1);
    }
    process.stdout.write("word count: 0\n");
    process.exit(0);
    break;

  case "summarize":
    if (version === "v1") {
      process.stderr.write("Error: unknown command 'summarize'\n");
      process.exit(1);
    }
    process.stdout.write("summary: no input\n");
    process.exit(0);
    break;

  case "export":
    if (version === "v1") {
      process.stderr.write("Error: unknown command 'export'\n");
      process.exit(1);
    }
    process.stdout.write(`exported to ${args[1] || "default"}\n`);
    process.exit(0);
    break;

  default:
    process.stderr.write(`Unknown command: ${command}\n`);
    process.exit(1);
    break;
}
