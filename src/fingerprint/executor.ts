import { spawn } from "child_process";
import { ProbeConfig, ProbeResult } from "./types.js";

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_STDOUT = 4096;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + `\n... [truncated, ${text.length} bytes total]`;
}

export async function runProbe(
  probe: ProbeConfig,
  toolDir?: string
): Promise<ProbeResult> {
  if (probe.skip) {
    return {
      name: probe.name,
      command: buildCommand(probe),
      stdout: "",
      stderr: "",
      exitCode: null,
      timedOut: false,
      execError: null,
      durationMs: 0,
      skipped: true,
    };
  }

  const tool = probe.tool;
  const args = probe.args ?? [];
  const cwd = probe.cwd ?? toolDir ?? process.cwd();
  const timeout = probe.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const env = { ...process.env };

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
    let execError: string | null = null;

    const child = spawn(tool, args, { cwd, env, timeout });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeout);

    if (probe.stdin && child.stdin) {
      child.stdin.write(probe.stdin);
      child.stdin.end();
    }

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (err: Error) => {
      clearTimeout(timer);
      execError = err.message;
      resolve({
        name: probe.name,
        command: buildCommand(probe),
        stdout: truncate(stdout, DEFAULT_MAX_STDOUT),
        stderr: truncate(stderr, DEFAULT_MAX_STDOUT),
        exitCode: null,
        timedOut,
        execError,
        durationMs: Date.now() - start,
        skipped: false,
      });
    });

    child.on("close", (code: number | null) => {
      clearTimeout(timer);
      resolve({
        name: probe.name,
        command: buildCommand(probe),
        stdout: truncate(stdout, DEFAULT_MAX_STDOUT),
        stderr: truncate(stderr, DEFAULT_MAX_STDOUT),
        exitCode: code,
        timedOut,
        execError,
        durationMs: Date.now() - start,
        skipped: false,
      });
    });
  });
}

function buildCommand(probe: ProbeConfig): string {
  const args = (probe.args ?? []).join(" ");
  return args ? `${probe.tool} ${args}` : probe.tool;
}
