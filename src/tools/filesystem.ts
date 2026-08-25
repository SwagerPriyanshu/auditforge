/**
 * AuditForge — Filesystem Tools
 *
 * Safe file operations with structured output and metadata.
 * Every call is routed through the ToolInterceptor for auditing.
 *
 * Risk scores:
 *   read_file: 2        (safe — reading)
 *   write_file: 6       (moderate — writing)
 *   delete_file: 9      (critical — destructive)
 *   list_directory: 1   (safe — browsing)
 *   file_exists: 1      (safe — checking)
 *   get_file_info: 1    (safe — metadata)
 */

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// ─── Types ─────────────────────────────────────────────────────

export interface ToolContext {
  sessionId: string;
  userId?: string;
  cwd?: string;
}

export interface FileContent {
  path: string;
  content: string;
  size: number;
  hash: string;
  lastModified: string;
}

export interface WriteResult {
  path: string;
  bytesWritten: number;
  hash: string;
  backupPath: string | null;
}

export interface DirectoryEntry {
  name: string;
  type: "file" | "directory" | "symlink" | "other";
  size: number;
  lastModified: string;
}

export interface DirectoryListing {
  path: string;
  entries: DirectoryEntry[];
  totalFiles: number;
  totalDirectories: number;
}

export interface DeleteResult {
  path: string;
  deleted: boolean;
  backupPath: string | null;
}

export interface FileInfo {
  path: string;
  exists: boolean;
  type: string;
  size: number;
  created: string;
  lastModified: string;
  permissions: string;
  hash: string | null;
}

// ─── Tool Definitions ──────────────────────────────────────────

export const FILESYSTEM_TOOLS = {
  read_file: {
    riskScore: 2,
    description: "Read file contents",
    category: "read" as const,
  },
  write_file: {
    riskScore: 6,
    description: "Write or create a file",
    category: "write" as const,
  },
  delete_file: {
    riskScore: 9,
    description: "Delete a file (destructive)",
    category: "write" as const,
  },
  list_directory: {
    riskScore: 1,
    description: "List directory contents",
    category: "read" as const,
  },
  file_exists: {
    riskScore: 1,
    description: "Check if a file exists",
    category: "read" as const,
  },
  get_file_info: {
    riskScore: 1,
    description: "Get file metadata",
    category: "read" as const,
  },
};

// ─── Implementations ───────────────────────────────────────────

const DATA_DIR = path.resolve(process.env.DATA_DIR ?? "./data/workspace");

async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

function resolvePath(filePath: string, cwd?: string): string {
  // Prevent path traversal outside workspace
  const base = cwd ? path.resolve(DATA_DIR, cwd) : DATA_DIR;
  const resolved = path.resolve(base, filePath);
  if (!resolved.startsWith(DATA_DIR)) {
    throw new Error(`Path traversal detected: ${filePath} resolves outside workspace`);
  }
  return resolved;
}

function contentHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 16);
}

/**
 * Read a file's contents.
 */
export async function readFile(
  ctx: ToolContext,
  filePath: string
): Promise<FileContent> {
  await ensureDataDir();
  const resolved = resolvePath(filePath, ctx.cwd);

  const content = await fs.readFile(resolved, "utf-8");
  const stat = await fs.stat(resolved);

  return {
    path: filePath,
    content,
    size: stat.size,
    hash: contentHash(content),
    lastModified: stat.mtime.toISOString(),
  };
}

/**
 * Write content to a file (creates backup of existing).
 */
export async function writeFile(
  ctx: ToolContext,
  filePath: string,
  content: string
): Promise<WriteResult> {
  await ensureDataDir();
  const resolved = resolvePath(filePath, ctx.cwd);

  // Create backup if file exists
  let backupPath: string | null = null;
  try {
    const existing = await fs.readFile(resolved, "utf-8");
    backupPath = `${resolved}.bak.${Date.now()}`;
    await fs.writeFile(backupPath, existing, "utf-8");
  } catch {
    // File doesn't exist yet — no backup needed
  }

  // Ensure parent directory exists
  const dir = path.dirname(resolved);
  await fs.mkdir(dir, { recursive: true });

  await fs.writeFile(resolved, content, "utf-8");

  return {
    path: filePath,
    bytesWritten: Buffer.byteLength(content, "utf-8"),
    hash: contentHash(content),
    backupPath,
  };
}

/**
 * Delete a file (moves to backup location instead of hard delete).
 */
export async function deleteFile(
  ctx: ToolContext,
  filePath: string
): Promise<DeleteResult> {
  await ensureDataDir();
  const resolved = resolvePath(filePath, ctx.cwd);

  // Move to trash instead of deleting
  const trashDir = path.join(DATA_DIR, ".trash");
  await fs.mkdir(trashDir, { recursive: true });

  const trashPath = path.join(trashDir, `${path.basename(filePath)}.${Date.now()}`);

  try {
    await fs.rename(resolved, trashPath);
    return { path: filePath, deleted: true, backupPath: trashPath };
  } catch {
    // If rename fails (cross-device), copy then delete
    try {
      const content = await fs.readFile(resolved, "utf-8");
      await fs.writeFile(trashPath, content, "utf-8");
      await fs.unlink(resolved);
      return { path: filePath, deleted: true, backupPath: trashPath };
    } catch (err) {
      return {
        path: filePath,
        deleted: false,
        backupPath: null,
      };
    }
  }
}

/**
 * List directory contents.
 */
export async function listDirectory(
  ctx: ToolContext,
  dirPath: string
): Promise<DirectoryListing> {
  await ensureDataDir();
  const resolved = resolvePath(dirPath, ctx.cwd);

  const items = await fs.readdir(resolved, { withFileTypes: true });
  const entries: DirectoryEntry[] = [];

  let totalFiles = 0;
  let totalDirectories = 0;

  for (const item of items) {
    const entryPath = path.join(resolved, item.name);
    let stat;
    try {
      stat = await fs.stat(entryPath);
    } catch {
      continue;
    }

    const type = item.isDirectory()
      ? "directory"
      : item.isSymbolicLink()
        ? "symlink"
        : item.isFile()
          ? "file"
          : "other";

    entries.push({
      name: item.name,
      type,
      size: stat.size,
      lastModified: stat.mtime.toISOString(),
    });

    if (type === "file") totalFiles++;
    if (type === "directory") totalDirectories++;
  }

  return { path: dirPath, entries, totalFiles, totalDirectories };
}

/**
 * Check if a file exists.
 */
export async function fileExists(
  ctx: ToolContext,
  filePath: string
): Promise<boolean> {
  await ensureDataDir();
  const resolved = resolvePath(filePath, ctx.cwd);

  try {
    await fs.access(resolved);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file metadata without reading contents.
 */
export async function getFileInfo(
  ctx: ToolContext,
  filePath: string
): Promise<FileInfo> {
  await ensureDataDir();
  const resolved = resolvePath(filePath, ctx.cwd);

  try {
    const stat = await fs.stat(resolved);
    const content = stat.isFile() ? await fs.readFile(resolved, "utf-8") : null;

    return {
      path: filePath,
      exists: true,
      type: stat.isDirectory() ? "directory" : stat.isFile() ? "file" : "other",
      size: stat.size,
      created: stat.birthtime.toISOString(),
      lastModified: stat.mtime.toISOString(),
      permissions: stat.mode.toString(8).slice(-3),
      hash: content ? contentHash(content) : null,
    };
  } catch {
    return {
      path: filePath,
      exists: false,
      type: "unknown",
      size: 0,
      created: "",
      lastModified: "",
      permissions: "",
      hash: null,
    };
  }
}

// ─── Tool Dispatcher ───────────────────────────────────────────

export type FilesystemToolName = keyof typeof FILESYSTEM_TOOLS;

export async function executeFilesystemTool(
  toolName: FilesystemToolName,
  ctx: ToolContext,
  input: Record<string, unknown>
): Promise<unknown> {
  switch (toolName) {
    case "read_file":
      return readFile(ctx, input.path as string);
    case "write_file":
      return writeFile(ctx, input.path as string, input.content as string);
    case "delete_file":
      return deleteFile(ctx, input.path as string);
    case "list_directory":
      return listDirectory(ctx, input.path as string);
    case "file_exists":
      return { exists: await fileExists(ctx, input.path as string) };
    case "get_file_info":
      return getFileInfo(ctx, input.path as string);
    default:
      throw new Error(`Unknown filesystem tool: ${toolName}`);
  }
}
