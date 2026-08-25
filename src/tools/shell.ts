/**
 * AuditForge — Shell Tools
 *
 * Command execution with safety guards.
 *
 * Risk scores:
 *   exec: 7       (high — arbitrary command execution)
 *   exec_safe: 5  (moderate — sanitized commands only)
 *
 * exec_safe applies additional sanitization:
 *   - Blocks destructive patterns (rm -rf, DROP TABLE, etc.)
 *   - Limits command length
 *   - Adds timeout enforcement
 *   - Captures both stdout and stderr
 */

import { exec as nodeExec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(nodeExec);

// ─── Types ─────────────────────────────────────────────────────

export interface ToolContext {
  sessionId: string;
  userId?: string;
  cwd?: string;
}

export interface ShellResult {
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  timedOut: boolean;
  sanitized: boolean;
}

// ─── Tool Definitions ──────────────────────────────────────────

export const SHELL_TOOLS = {
  exec: {
    riskScore: 7,
    description: "Execute a shell command",
    category: "execute" as const,
  },
  exec_safe: {
    riskScore: 5,
    description: "Execute a sanitized shell command",
    category: "execute" as const,
  },
};

// ─── Blocked Patterns ──────────────────────────────────────────

const BLOCKED_PATTERNS = [
  { pattern: /\brm\s+-rf\s+\/\b/, reason: "Recursive deletion of root" },
  { pattern: /\brm\s+-rf\s+~\//, reason: "Recursive deletion of home" },
  { pattern: /\bmkfs\b/, reason: "Filesystem format command" },
  { pattern: /\bdd\s+if=.*of=\/dev\//, reason: "Direct device write" },
  { pattern: /\bchmod\s+777\s+\//, reason: "World-writable root" },
  { pattern: /\bDROP\s+TABLE\b/i, reason: "SQL table deletion" },
  { pattern: /\bDELETE\s+FROM\b.*\bWHERE\s+1\b/i, reason: "SQL mass deletion" },
  { pattern: /\bTRUNCATE\b/i, reason: "SQL table truncation" },
  { pattern: />\s*\/dev\/sd[a-z]/, reason: "Direct disk write" },
  { pattern: /\bcurl\b.*\|\s*(ba)?sh\b/, reason: "Remote code execution" },
  { pattern: /\bwget\b.*\|\s*(ba)?sh\b/, reason: "Remote code execution" },
];

const SANITIZED_PATTERNS = [
  { pattern: /\brm\b/, replacement: "echo 'rm blocked by AuditForge'" },
  { pattern: /\bkill\b/, replacement: "echo 'kill blocked by AuditForge'" },
  { pattern: /\bpkill\b/, replacement: "echo 'pkill blocked by AuditForge'" },
  { pattern: /\bsudo\b/, replacement: "echo 'sudo blocked by AuditForge'" },
];

// ─── Implementations ───────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_COMMAND_LENGTH = 4096;

/**
 * Execute a shell command (unsanitized).
 *
 * WARNING: This runs arbitrary commands. Use exec_safe for
 * production use. The interceptor will flag this as high risk.
 */
export async function exec(
  ctx: ToolContext,
  command: string,
  cwd?: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<ShellResult> {
  if (command.length > MAX_COMMAND_LENGTH) {
    throw new Error(`Command exceeds maximum length (${MAX_COMMAND_LENGTH} chars)`);
  }

  const workingDir = cwd ?? ctx.cwd ?? process.cwd();
  const startTime = Date.now();
  let timedOut = false;

  try {
    const result = await execAsync(command, {
      cwd: workingDir,
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024, // 10MB
      env: {
        ...process.env,
        AUDITFORGE_SESSION: ctx.sessionId,
      },
    });

    return {
      command,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: 0,
      durationMs: Date.now() - startTime,
      timedOut: false,
      sanitized: false,
    };
  } catch (err: unknown) {
    const execErr = err as {
      code?: number;
      stdout?: string;
      stderr?: string;
      killed?: boolean;
    };

    if (execErr.killed) {
      timedOut = true;
    }

    return {
      command,
      stdout: execErr.stdout ?? "",
      stderr: execErr.stderr ?? (err instanceof Error ? err.message : "Unknown error"),
      exitCode: execErr.code ?? 1,
      durationMs: Date.now() - startTime,
      timedOut,
      sanitized: false,
    };
  }
}

/**
 * Execute a sanitized shell command.
 *
 * Applies additional safety checks before execution:
 *   1. Blocks destructive patterns
 *   2. Sanitizes dangerous subcommands
 *   3. Enforces timeout
 *   4. Captures full output
 */
export async function execSafe(
  ctx: ToolContext,
  command: string,
  cwd?: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<ShellResult> {
  // Check blocked patterns
  for (const { pattern, reason } of BLOCKED_PATTERNS) {
    if (pattern.test(command)) {
      return {
        command,
        stdout: "",
        stderr: `Blocked by AuditForge safety check: ${reason}`,
        exitCode: 1,
        durationMs: 0,
        timedOut: false,
        sanitized: true,
      };
    }
  }

  // Sanitize dangerous subcommands
  let sanitizedCommand = command;
  for (const { pattern, replacement } of SANITIZED_PATTERNS) {
    if (pattern.test(sanitizedCommand)) {
      sanitizedCommand = sanitizedCommand.replace(pattern, replacement);
    }
  }

  // Execute the (possibly sanitized) command
  return exec(ctx, sanitizedCommand, cwd, timeoutMs);
}

// ─── Tool Dispatcher ───────────────────────────────────────────

export type ShellToolName = keyof typeof SHELL_TOOLS;

export async function executeShellTool(
  toolName: ShellToolName,
  ctx: ToolContext,
  input: Record<string, unknown>
): Promise<ShellResult> {
  const command = input.command as string;
  const cwd = input.cwd as string | undefined;
  const timeout = (input.timeout as number | undefined) ?? DEFAULT_TIMEOUT_MS;

  if (!command) {
    throw new Error("Shell tool requires a 'command' parameter");
  }

  switch (toolName) {
    case "exec":
      return exec(ctx, command, cwd, timeout);
    case "exec_safe":
      return execSafe(ctx, command, cwd, timeout);
    default:
      throw new Error(`Unknown shell tool: ${toolName}`);
  }
}
