#!/usr/bin/env node
/**
 * call-model.mjs — nxtlvl multi-target companion for cross-model CLI invocation.
 *
 * Usage:
 *   node call-model.mjs <mode> --target <codex|grok|gemini|devin|claude> [options]
 *
 * Modes: setup | consult | adversarial | review | task
 * Options:
 *   --cwd <dir>           Working directory (default: process.cwd())
 *   --prompt-file <path>  Prompt file (required for consult/adversarial/task)
 *   --write               Allow writes (task mode only)
 *   --base <ref>          Review base ref (Codex compose review)
 *   --json                Machine-readable setup output
 *   --skip-git-repo-check Pass through to codex exec when needed
 *
 * Env:
 *   CODEX_COMPANION=0           Force portable Codex exec
 *   CODEX_COMPANION_PATH        Pin path to codex-companion.mjs
 *   CALL_MODEL_TIMEOUT_MS       Child timeout (default 600000)
 */

import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VALID_TARGETS = new Set(["codex", "grok", "gemini", "devin", "claude"]);
const VALID_MODES = new Set(["setup", "consult", "adversarial", "review", "task"]);
const DEFAULT_TIMEOUT_MS = Number(process.env.CALL_MODEL_TIMEOUT_MS || 600_000);

function usage(exitCode = 1) {
  const text = `Usage:
  node call-model.mjs <mode> --target <codex|grok|gemini|devin|claude> [options]

Modes:
  setup         Preflight binary + transport (no prompt)
  consult       Read-only second opinion from --prompt-file
  adversarial   Read-only adversarial pass from --prompt-file
  review        Git-scoped review (Codex: prefer OpenAI companion)
  task          Task handoff; requires --write for workspace writes

Options:
  --cwd <dir>                 Working directory (default: cwd)
  --prompt-file <path>        Prompt file (consult/adversarial/task)
  --write                     Allow writes (task only)
  --base <ref>                Branch base for Codex compose review
  --json                      JSON setup report
  --skip-git-repo-check       Codex exec: skip git repo check
  -h, --help                  Show help
`;
  process.stdout.write(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const out = {
    mode: null,
    target: null,
    cwd: process.cwd(),
    promptFile: null,
    write: false,
    base: null,
    json: false,
    skipGitRepoCheck: false,
  };
  const args = argv.slice(2);
  if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
    usage(0);
  }
  out.mode = args[0];
  for (let i = 1; i < args.length; i++) {
    const a = args[i];
    if (a === "--target") out.target = args[++i];
    else if (a === "--cwd") out.cwd = path.resolve(args[++i] ?? "");
    else if (a === "--prompt-file") out.promptFile = path.resolve(args[++i] ?? "");
    else if (a === "--write") out.write = true;
    else if (a === "--base") out.base = args[++i];
    else if (a === "--json") out.json = true;
    else if (a === "--skip-git-repo-check") out.skipGitRepoCheck = true;
    else if (a === "-h" || a === "--help") usage(0);
    else {
      process.stderr.write(`Unknown argument: ${a}\n`);
      usage(1);
    }
  }
  return out;
}

function which(bin) {
  const r = spawnSync("which", [bin], { encoding: "utf8" });
  if (r.status !== 0) return null;
  return r.stdout.trim() || null;
}

function runCapture(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    encoding: "utf8",
    cwd: opts.cwd || process.cwd(),
    env: opts.env || process.env,
    timeout: opts.timeout ?? 30_000,
  });
  return {
    status: r.status,
    stdout: (r.stdout || "").trim(),
    stderr: (r.stderr || "").trim(),
    error: r.error,
  };
}

function listCompanionCandidates() {
  const home = os.homedir();
  const found = [];
  if (process.env.CODEX_COMPANION_PATH) {
    found.push(process.env.CODEX_COMPANION_PATH);
  }
  const marketplace = path.join(
    home,
    ".claude/plugins/marketplaces/openai-codex/plugins/codex/scripts/codex-companion.mjs",
  );
  found.push(marketplace);

  const cacheRoot = path.join(home, ".claude/plugins/cache/openai-codex/codex");
  try {
    if (fs.existsSync(cacheRoot)) {
      const versions = fs
        .readdirSync(cacheRoot, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort()
        .reverse();
      for (const v of versions) {
        found.push(path.join(cacheRoot, v, "scripts", "codex-companion.mjs"));
      }
    }
  } catch {
    /* ignore */
  }
  return found;
}

function findCodexCompanion() {
  if (process.env.CODEX_COMPANION === "0") return null;
  for (const p of listCompanionCandidates()) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

function requirePromptFile(opts) {
  if (!opts.promptFile) {
    die("--prompt-file is required for this mode");
  }
  if (!fs.existsSync(opts.promptFile)) {
    die(`prompt file not found: ${opts.promptFile}`);
  }
}

function die(msg, code = 1) {
  process.stderr.write(`call-model: ${msg}\n`);
  process.exit(code);
}

function runStreaming(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd || process.cwd(),
      env: opts.env || process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer =
      opts.timeoutMs > 0
        ? setTimeout(() => {
            child.kill("SIGTERM");
            setTimeout(() => child.kill("SIGKILL"), 2000).unref?.();
          }, opts.timeoutMs)
        : null;

    child.stdout.on("data", (buf) => {
      const s = buf.toString();
      stdout += s;
      process.stdout.write(s);
    });
    child.stderr.on("data", (buf) => {
      const s = buf.toString();
      stderr += s;
      process.stderr.write(s);
    });
    child.on("error", (err) => {
      if (timer) clearTimeout(timer);
      process.stderr.write(`call-model: spawn error: ${err.message}\n`);
      resolve({ status: 1, stdout, stderr: stderr + String(err) });
    });
    child.on("close", (code, signal) => {
      if (timer) clearTimeout(timer);
      const status = code === null ? 1 : code;
      if (signal) {
        process.stderr.write(`call-model: child killed by ${signal}\n`);
      }
      resolve({ status, stdout, stderr });
    });
  });
}

/** @returns {Promise<number>} */
async function runWithStdinFile(cmd, args, promptFile, opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd || process.cwd(),
      env: opts.env || process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const timer =
      opts.timeoutMs > 0
        ? setTimeout(() => {
            child.kill("SIGTERM");
            setTimeout(() => child.kill("SIGKILL"), 2000).unref?.();
          }, opts.timeoutMs)
        : null;

    const input = fs.createReadStream(promptFile);
    input.pipe(child.stdin);
    input.on("error", (err) => {
      process.stderr.write(`call-model: prompt read error: ${err.message}\n`);
      child.kill("SIGTERM");
    });

    child.stdout.on("data", (buf) => process.stdout.write(buf));
    child.stderr.on("data", (buf) => process.stderr.write(buf));
    child.on("error", (err) => {
      if (timer) clearTimeout(timer);
      process.stderr.write(`call-model: spawn error: ${err.message}\n`);
      resolve(1);
    });
    child.on("close", (code, signal) => {
      if (timer) clearTimeout(timer);
      if (signal) process.stderr.write(`call-model: child killed by ${signal}\n`);
      resolve(code === null ? 1 : code);
    });
  });
}

function versionOf(bin, pathToBin) {
  const attempts = [
    [pathToBin, ["--version"]],
    [pathToBin, ["version"]],
    [pathToBin, ["-v"]],
  ];
  for (const [cmd, args] of attempts) {
    const r = runCapture(cmd, args, { timeout: 10_000 });
    if (r.status === 0 && r.stdout) return r.stdout.split("\n")[0];
  }
  return null;
}

function setupReport(target, opts) {
  const bin = which(target === "claude" ? "claude" : target);
  const companion = target === "codex" ? findCodexCompanion() : null;
  const forcePortable = process.env.CODEX_COMPANION === "0";
  let transport = "missing";
  if (bin) {
    if (target === "codex") {
      transport = companion && !forcePortable ? "openai-companion" : "portable-exec";
    } else {
      transport = "portable-cli";
    }
  }
  const version = bin ? versionOf(target === "claude" ? "claude" : target, bin) : null;
  const caveats = [];
  if (target === "gemini") {
    caveats.push(
      "gemini --version can pass while real prompts fail (free-tier / IneligibleTierError); run a real smoke before relying on it",
    );
  }
  if (target === "codex" && forcePortable) {
    caveats.push("CODEX_COMPANION=0 — portable exec only");
  }
  if (target === "codex" && companion) {
    caveats.push(`companion: ${companion}`);
  }
  if (!bin) {
    caveats.push(`${target} not found in PATH`);
  }

  const report = {
    ok: Boolean(bin),
    target,
    binary: bin,
    version,
    transport,
    companion: companion,
    cwd: opts.cwd,
    caveats,
  };

  if (opts.json) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else {
    process.stdout.write(
      [
        `target:     ${report.target}`,
        `ok:         ${report.ok}`,
        `binary:     ${report.binary || "(not found)"}`,
        `version:    ${report.version || "(unknown)"}`,
        `transport:  ${report.transport}`,
        companion ? `companion:  ${companion}` : null,
        caveats.length ? `caveats:` : null,
        ...caveats.map((c) => `  - ${c}`),
        "",
      ]
        .filter((l) => l !== null)
        .join("\n"),
    );
  }
  return report.ok ? 0 : 2;
}

async function invokeCodex(mode, opts) {
  const companion = findCodexCompanion();
  const useCompose = Boolean(companion) && process.env.CODEX_COMPANION !== "0";

  if (mode === "review" && useCompose) {
    const args = [companion, "review", "--wait"];
    if (opts.base) args.push("--base", opts.base);
    process.stderr.write(`call-model: transport=openai-companion review\n`);
    const r = await runStreaming(process.execPath, args, {
      cwd: opts.cwd,
      timeoutMs: DEFAULT_TIMEOUT_MS,
    });
    return r.status;
  }

  if (mode === "task" && useCompose) {
    requirePromptFile(opts);
    const prompt = fs.readFileSync(opts.promptFile, "utf8");
    const args = [companion, "task"];
    if (opts.write) args.push("--write");
    args.push(prompt);
    process.stderr.write(
      `call-model: transport=openai-companion task write=${opts.write}\n`,
    );
    const r = await runStreaming(process.execPath, args, {
      cwd: opts.cwd,
      timeoutMs: DEFAULT_TIMEOUT_MS,
    });
    return r.status;
  }

  // portable exec for consult / adversarial / review fallback / task fallback
  requirePromptFile(opts);
  const sandbox = opts.write && mode === "task" ? "workspace-write" : "read-only";
  const args = ["exec", "--sandbox", sandbox, "-C", opts.cwd];
  if (opts.skipGitRepoCheck) args.push("--skip-git-repo-check");
  args.push("-");
  process.stderr.write(
    `call-model: transport=portable-exec codex sandbox=${sandbox}\n`,
  );
  return runWithStdinFile("codex", args, opts.promptFile, {
    cwd: opts.cwd,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  });
}

async function invokeGrok(mode, opts) {
  requirePromptFile(opts);
  const args = [
    "--prompt-file",
    opts.promptFile,
    "--cwd",
    opts.cwd,
    "--no-subagents",
    "--disable-web-search",
  ];
  if (!(opts.write && mode === "task")) {
    args.push("--sandbox", "read-only");
  }
  process.stderr.write(`call-model: transport=portable-cli grok\n`);
  const r = await runStreaming("grok", args, {
    cwd: opts.cwd,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  });
  return r.status;
}

async function invokeGemini(mode, opts) {
  requirePromptFile(opts);
  if (opts.write && mode === "task") {
    die("gemini write/task is not enabled in call-model v1 (use consult/adversarial read-only)");
  }
  const args = ["--approval-mode", "plan", "-p", ""];
  process.stderr.write(`call-model: transport=portable-cli gemini plan-mode\n`);
  return runWithStdinFile("gemini", args, opts.promptFile, {
    cwd: opts.cwd,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  });
}

async function invokeDevin(mode, opts) {
  requirePromptFile(opts);
  const perm =
    opts.write && mode === "task" ? "accept-edits" : "auto";
  const args = ["-p", "--prompt-file", opts.promptFile, "--permission-mode", perm];
  process.stderr.write(`call-model: transport=portable-cli devin permission=${perm}\n`);
  const r = await runStreaming("devin", args, {
    cwd: opts.cwd,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  });
  return r.status;
}

async function invokeClaude(mode, opts) {
  requirePromptFile(opts);
  if (opts.write && mode === "task") {
    die("claude write/task is not enabled via call-model; use a normal Claude session");
  }
  const args = [
    "-p",
    "",
    "--disallowedTools",
    "Write",
    "Edit",
    "NotebookEdit",
    "Bash",
    "--setting-sources",
    "project",
  ];
  process.stderr.write(`call-model: transport=portable-cli claude -p read-only tools\n`);
  return runWithStdinFile("claude", args, opts.promptFile, {
    cwd: opts.cwd,
    env: { ...process.env, NXTLVL_CM_OBSERVER: "1" },
    timeoutMs: DEFAULT_TIMEOUT_MS,
  });
}

async function main() {
  const opts = parseArgs(process.argv);
  if (!VALID_MODES.has(opts.mode)) {
    die(`invalid mode: ${opts.mode}`);
  }
  if (!opts.target || !VALID_TARGETS.has(opts.target)) {
    die(`--target is required and must be one of: ${[...VALID_TARGETS].join(", ")}`);
  }
  if (opts.write && opts.mode !== "task") {
    die("--write is only valid with mode=task");
  }
  if (opts.mode === "task" && !opts.write) {
    process.stderr.write(
      "call-model: task without --write runs read-only (diagnosis only). Pass --write to allow edits.\n",
    );
  }

  if (!fs.existsSync(opts.cwd) || !fs.statSync(opts.cwd).isDirectory()) {
    die(`--cwd is not a directory: ${opts.cwd}`);
  }

  if (opts.mode === "setup") {
    process.exit(setupReport(opts.target, opts));
  }

  const binName = opts.target === "claude" ? "claude" : opts.target;
  if (!which(binName)) {
    die(`${binName} not found in PATH — run: call-model.mjs setup --target ${opts.target}`);
  }

  if (opts.mode === "review" && opts.target !== "codex") {
    // Portable review: require a prompt that already includes diff context
    if (!opts.promptFile) {
      die(
        `review for target=${opts.target} requires --prompt-file (include git diff / review instructions)`,
      );
    }
  }

  let status;
  switch (opts.target) {
    case "codex":
      status = await invokeCodex(opts.mode, opts);
      break;
    case "grok":
      status = await invokeGrok(opts.mode, opts);
      break;
    case "gemini":
      status = await invokeGemini(opts.mode, opts);
      break;
    case "devin":
      status = await invokeDevin(opts.mode, opts);
      break;
    case "claude":
      status = await invokeClaude(opts.mode, opts);
      break;
    default:
      die(`unsupported target: ${opts.target}`);
  }
  process.exit(status ?? 1);
}

main().catch((err) => {
  process.stderr.write(`call-model: fatal: ${err?.stack || err}\n`);
  process.exit(1);
});
