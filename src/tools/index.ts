/**
 * AuditForge — Tool Registry
 *
 * Central registry for all tools. Maps tool names to their
 * risk scores, categories, and execution functions.
 *
 * The orchestrator uses this registry to dispatch tool calls
 * through the interceptor, ensuring every call is audited.
 */

import {
  FILESYSTEM_TOOLS,
  executeFilesystemTool,
  type ToolContext as FsContext,
} from "./filesystem";
import {
  GITHUB_TOOLS,
  executeGithubTool,
  type ToolContext as GhContext,
} from "./github";
import {
  SHELL_TOOLS,
  executeShellTool,
  type ToolContext as ShContext,
} from "./shell";
import {
  API_TOOLS,
  executeApiTool,
  type ToolContext as ApiContext,
} from "./api";

// ─── Unified Types ─────────────────────────────────────────────

export interface ToolContext {
  sessionId: string;
  userId?: string;
  cwd?: string;
}

export interface ToolDefinition {
  name: string;
  riskScore: number;
  description: string;
  category: "read" | "write" | "execute" | "network" | "approval" | "system";
}

export type ToolExecutor = (
  ctx: ToolContext,
  input: Record<string, unknown>
) => Promise<unknown>;

// ─── Tool Registry ─────────────────────────────────────────────

const toolDefinitions = new Map<string, ToolDefinition>();
const toolExecutors = new Map<string, ToolExecutor>();

function registerTools(
  tools: Record<string, { riskScore: number; description: string; category: ToolDefinition["category"] }>,
  executor: (name: string, ctx: ToolContext, input: Record<string, unknown>) => Promise<unknown>
): void {
  for (const [name, def] of Object.entries(tools)) {
    toolDefinitions.set(name, { name, ...def });
    toolExecutors.set(name, (ctx, input) => executor(name, ctx, input));
  }
}

// Register all tool modules
registerTools(FILESYSTEM_TOOLS, (name, ctx, input) =>
  executeFilesystemTool(name as keyof typeof FILESYSTEM_TOOLS, ctx as FsContext, input)
);

registerTools(GITHUB_TOOLS, (name, ctx, input) =>
  executeGithubTool(name as keyof typeof GITHUB_TOOLS, ctx as GhContext, input)
);

registerTools(SHELL_TOOLS, (name, ctx, input) =>
  executeShellTool(name as keyof typeof SHELL_TOOLS, ctx as ShContext, input)
);

registerTools(API_TOOLS, (name, ctx, input) =>
  executeApiTool(name as keyof typeof API_TOOLS, ctx as ApiContext, input)
);

// ─── Registry API ──────────────────────────────────────────────

export function getToolDefinition(name: string): ToolDefinition | undefined {
  return toolDefinitions.get(name);
}

export function getToolExecutor(name: string): ToolExecutor | undefined {
  return toolExecutors.get(name);
}

export function getAllTools(): ToolDefinition[] {
  return Array.from(toolDefinitions.values());
}

export function getToolsByCategory(
  category: ToolDefinition["category"]
): ToolDefinition[] {
  return getAllTools().filter((t) => t.category === category);
}

export function getRiskScore(toolName: string): number {
  return toolDefinitions.get(toolName)?.riskScore ?? 5;
}

export function isKnownTool(toolName: string): boolean {
  return toolDefinitions.has(toolName);
}

/**
 * Execute a tool by name. Routes through the interceptor.
 */
export async function executeTool(
  toolName: string,
  ctx: ToolContext,
  input: Record<string, unknown>
): Promise<unknown> {
  const executor = toolExecutors.get(toolName);
  if (!executor) {
    throw new Error(`Unknown tool: ${toolName}. Available: ${getAllTools().map((t) => t.name).join(", ")}`);
  }
  return executor(ctx, input);
}

// ─── Simulated Tool Responses (for demo) ───────────────────────

export function getSimulatedResponse(
  toolName: string,
  input: Record<string, unknown>
): unknown {
  const simulations: Record<string, unknown> = {
    read_file: {
      content: `[2026-08-29T14:32:00Z] INFO Deployment v2.14.3 started
[2026-08-29T14:32:05Z] INFO Redis pool: 20 → 8
[2026-08-29T14:32:10Z] INFO Deploy completed
[2026-08-29T14:45:00Z] ERROR ConnectionPoolExhausted after 5s
[2026-08-29T14:45:01Z] ERROR 503 rate: 147.3 req/sec`,
      path: input.path,
      size: 312,
      hash: "a1b2c3d4e5f6",
      lastModified: new Date().toISOString(),
    },
    list_directory: {
      path: input.path ?? ".",
      entries: [
        { name: "config/", type: "directory", size: 0, lastModified: "" },
        { name: "src/", type: "directory", size: 0, lastModified: "" },
        { name: "logs/", type: "directory", size: 0, lastModified: "" },
        { name: "package.json", type: "file", size: 1234, lastModified: "" },
      ],
      totalFiles: 1,
      totalDirectories: 3,
    },
    search_files: {
      matches: [
        { path: "./config/redis.yaml", line: 3, content: "pool_size: 8" },
        { path: "./config/redis.yaml.bak", line: 3, content: "pool_size: 20" },
      ],
    },
    list_commits: {
      commits: [
        { hash: "a1b2c3d", message: "feat: optimize Redis pool", author: "deploy-bot", date: "2026-08-29T14:30:00Z" },
        { hash: "e4f5g6h", message: "fix: rate limiter config", author: "dev-x", date: "2026-08-29T13:00:00Z" },
      ],
    },
    execute_code: {
      output: JSON.stringify({ cpus: 8, memFree: 2147483648, loadAvg: [2.5, 1.8, 1.2] }),
      language: "javascript",
    },
    exec: {
      command: input.command ?? "uptime",
      stdout: " 14:50:00 up 3 days, load average: 2.5, 1.8, 1.2",
      stderr: "",
      exitCode: 0,
      durationMs: 45,
      timedOut: false,
      sanitized: false,
    },
    api_get: {
      url: input.url,
      method: "GET",
      status: 200,
      statusText: "OK",
      headers: { "content-type": "application/json" },
      body: { status: "ok" },
      durationMs: 230,
    },
  };

  return simulations[toolName] ?? { result: "simulated", tool: toolName, input };
}
