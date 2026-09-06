import { spawn } from "node:child_process";

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_STDOUT = 4096;

export function truncate(text, max) {
  const encoded = Buffer.from(text, "utf8");
  if (encoded.length <= max) return text;

  let end = Math.max(0, max);
  while (end > 0 && (encoded[end] & 0xc0) === 0x80) end -= 1;

  const prefix = encoded.subarray(0, end).toString("utf8");
  return `${prefix}\n... [truncated, ${encoded.length} bytes total]`;
}

export async function runProbe(probe, toolDir) {
  const normalized = normalizeProbe(probe);

  if (probe.skip) {
    return {
      name: probe.name,
      command: buildCommand(normalized),
      stdout: "",
      stderr: "",
      exitCode: null,
      expectedExitCode: probe.expectedExitCode ?? null,
      expectedExitMatched: null,
      timedOut: false,
      execError: null,
      durationMs: 0,
      skipped: true,
    };
  }

  const tool = normalized.tool;
  const args = normalized.args;
  const cwd = probe.cwd ?? toolDir ?? process.cwd();
  const timeout = probe.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const env = buildEnv(probe);

  if (probe.env) {
    for (const [key, value] of Object.entries(probe.env)) {
      env[key] = value;
    }
  }

  const start = Date.now();

  return new Promise((resolve) => {
    let timedOut = false;
    let stdout = "";
    let stderr = "";
    let execError = null;
    let termination = null;

    const child = spawn(tool, args, { cwd, env, detached: process.platform !== "win32" });

    const timer = setTimeout(() => {
      timedOut = true;
      termination = terminateProcessTree(child);
    }, timeout);

    if (probe.stdin !== undefined && child.stdin) {
      child.stdin.write(probe.stdin);
      child.stdin.end();
    }

    if (child.stdout) {
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
    }

    if (child.stderr) {
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on("error", async (err) => {
      clearTimeout(timer);
      if (termination) await termination;
      execError = err.message;
      resolve({
        name: probe.name,
        command: buildCommand(normalized),
        stdout: truncate(stdout, DEFAULT_MAX_STDOUT),
        stderr: truncate(stderr, DEFAULT_MAX_STDOUT),
        exitCode: null,
        expectedExitCode: probe.expectedExitCode ?? null,
        expectedExitMatched: probe.expectedExitCode === undefined ? null : false,
        timedOut,
        execError,
        durationMs: Date.now() - start,
        skipped: false,
      });
    });

    child.on("close", async (code) => {
      clearTimeout(timer);
      if (termination) await termination;
      resolve({
        name: probe.name,
        command: buildCommand(normalized),
        stdout: truncate(stdout, DEFAULT_MAX_STDOUT),
        stderr: truncate(stderr, DEFAULT_MAX_STDOUT),
        exitCode: code,
        expectedExitCode: probe.expectedExitCode ?? null,
        expectedExitMatched:
          probe.expectedExitCode === undefined ? null : code === probe.expectedExitCode,
        timedOut,
        execError: null,
        durationMs: Date.now() - start,
        skipped: false,
      });
    });
  });
}

async function terminateProcessTree(child) {
  if (child.pid === undefined) return;
  if (process.platform !== "win32") {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch (err) {
      if (err?.code !== "ESRCH") child.kill("SIGKILL");
    }
    return;
  }
  await new Promise((resolve) => {
    const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
    killer.once("error", () => {
      child.kill("SIGKILL");
      resolve();
    });
    killer.once("close", resolve);
  });
}

export function normalizeProbe(probe) {
  if (probe.command) {
    const parts = splitCommand(probe.command);
    return {
      ...probe,
      tool: parts[0],
      args: [...parts.slice(1), ...(probe.args ?? [])],
    };
  }

  const parts = splitCommand(probe.tool);
  return {
    ...probe,
    tool: parts[0],
    args: [...parts.slice(1), ...(probe.args ?? [])],
  };
}

function buildEnv(probe) {
  const env = {};
  const allowlist = probe.envAllowlist ?? null;

  if (allowlist) {
    for (const key of allowlist) {
      if (process.env[key] !== undefined) env[key] = process.env[key];
    }
    if (!allowlist.includes("PATH") && process.env.PATH !== undefined) env.PATH = process.env.PATH;
  } else {
    Object.assign(env, process.env);
  }

  return env;
}

function buildCommand(probe) {
  const args = (probe.args ?? []).map(quoteCommandPart).join(" ");
  return args ? `${quoteCommandPart(probe.tool)} ${args}` : quoteCommandPart(probe.tool);
}

function splitCommand(command) {
  if (typeof command !== "string" || command.trim() === "") return [];

  const parts = [];
  const pattern = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|[^\s]+/g;
  for (const match of command.matchAll(pattern)) {
    parts.push((match[1] ?? match[2] ?? match[0]).replaceAll('\\"', '"').replaceAll("\\'", "'"));
  }
  return parts;
}

function quoteCommandPart(part) {
  if (!part) return "";
  if (/^[A-Za-z0-9_./:=@+-]+$/.test(part)) return part;
  return JSON.stringify(part);
}
