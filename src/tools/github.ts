/**
 * AuditForge — GitHub Tools
 *
 * GitHub operations via MCP server or REST API fallback.
 * In production, these route through TrueForge's MCP connector.
 * In development, they use the GitHub REST API directly.
 *
 * Risk scores:
 *   get_repository: 1    (safe — read only)
 *   list_prs: 1          (safe — read only)
 *   get_pr_details: 1    (safe — read only)
 *   create_pr: 5         (moderate — creates external entity)
 *   comment_on_pr: 3     (low — adds comment)
 *   get_file_contents: 1 (safe — read only)
 *   create_issue: 5      (moderate — creates external entity)
 */

import crypto from "crypto";

// ─── Types ─────────────────────────────────────────────────────

export interface ToolContext {
  sessionId: string;
  userId?: string;
}

export interface RepoInfo {
  name: string;
  fullName: string;
  description: string;
  defaultBranch: string;
  language: string;
  stars: number;
  forks: number;
  openIssues: number;
}

export interface PR {
  number: number;
  title: string;
  state: "open" | "closed";
  author: string;
  createdAt: string;
  updatedAt: string;
  mergeable: boolean;
  additions: number;
  deletions: number;
}

export interface PRDetails extends PR {
  body: string;
  labels: string[];
  reviewers: string[];
  commits: number;
  changedFiles: number;
}

export interface Comment {
  id: number;
  author: string;
  body: string;
  createdAt: string;
}

export interface Issue {
  number: number;
  title: string;
  body: string;
  state: "open" | "closed";
  labels: string[];
  author: string;
  createdAt: string;
}

// ─── Tool Definitions ──────────────────────────────────────────

export const GITHUB_TOOLS = {
  get_repository: {
    riskScore: 1,
    description: "Get repository information",
    category: "read" as const,
  },
  list_prs: {
    riskScore: 1,
    description: "List pull requests",
    category: "read" as const,
  },
  get_pr_details: {
    riskScore: 1,
    description: "Get PR details",
    category: "read" as const,
  },
  create_pr: {
    riskScore: 5,
    description: "Create a pull request",
    category: "network" as const,
  },
  comment_on_pr: {
    riskScore: 3,
    description: "Comment on a pull request",
    category: "network" as const,
  },
  get_file_contents: {
    riskScore: 1,
    description: "Get file contents from repository",
    category: "read" as const,
  },
  create_issue: {
    riskScore: 5,
    description: "Create an issue",
    category: "network" as const,
  },
};

// ─── GitHub API Client ─────────────────────────────────────────

const GITHUB_API = "https://api.github.com";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (GITHUB_TOKEN) {
    h.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }
  return h;
}

async function githubFetch(
  endpoint: string,
  options?: { method?: string; body?: unknown }
): Promise<unknown> {
  const url = `${GITHUB_API}${endpoint}`;

  const response = await fetch(url, {
    method: options?.method ?? "GET",
    headers: {
      ...headers(),
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${text}`);
  }

  return response.json();
}

// ─── Implementations ───────────────────────────────────────────

/**
 * Get repository information.
 */
export async function getRepository(
  _ctx: ToolContext,
  repo: string
): Promise<RepoInfo> {
  const data = (await githubFetch(`/repos/${repo}`)) as Record<string, unknown>;

  return {
    name: data.name as string,
    fullName: data.full_name as string,
    description: (data.description as string) ?? "",
    defaultBranch: data.default_branch as string,
    language: (data.language as string) ?? "unknown",
    stars: data.stargazers_count as number,
    forks: data.forks_count as number,
    openIssues: data.open_issues_count as number,
  };
}

/**
 * List pull requests.
 */
export async function listPrs(
  _ctx: ToolContext,
  repo: string,
  state: string = "open"
): Promise<PR[]> {
  const data = (await githubFetch(
    `/repos/${repo}/pulls?state=${state}&per_page=20`
  )) as Array<Record<string, unknown>>;

  return data.map((pr) => ({
    number: pr.number as number,
    title: pr.title as string,
    state: pr.state as "open" | "closed",
    author: ((pr.user as Record<string, unknown>)?.login as string) ?? "unknown",
    createdAt: pr.created_at as string,
    updatedAt: pr.updated_at as string,
    mergeable: (pr.mergeable as boolean) ?? false,
    additions: 0, // Not included in list endpoint
    deletions: 0,
  }));
}

/**
 * Get detailed PR information.
 */
export async function getPrDetails(
  _ctx: ToolContext,
  repo: string,
  prNumber: number
): Promise<PRDetails> {
  const data = (await githubFetch(
    `/repos/${repo}/pulls/${prNumber}`
  )) as Record<string, unknown>;

  return {
    number: data.number as number,
    title: data.title as string,
    state: data.state as "open" | "closed",
    author: ((data.user as Record<string, unknown>)?.login as string) ?? "unknown",
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    mergeable: (data.mergeable as boolean) ?? false,
    additions: data.additions as number,
    deletions: data.deletions as number,
    body: (data.body as string) ?? "",
    labels: ((data.labels as Array<Record<string, unknown>>)?.map(
      (l) => l.name as string
    )) ?? [],
    reviewers: [],
    commits: data.commits as number,
    changedFiles: data.changed_files as number,
  };
}

/**
 * Create a pull request.
 */
export async function createPr(
  _ctx: ToolContext,
  repo: string,
  title: string,
  body: string,
  head: string,
  base: string
): Promise<PR> {
  const data = (await githubFetch(`/repos/${repo}/pulls`, {
    method: "POST",
    body: { title, body, head, base },
  })) as Record<string, unknown>;

  return {
    number: data.number as number,
    title: data.title as string,
    state: data.state as "open" | "closed",
    author: ((data.user as Record<string, unknown>)?.login as string) ?? "unknown",
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    mergeable: false,
    additions: 0,
    deletions: 0,
  };
}

/**
 * Comment on a pull request.
 */
export async function commentOnPr(
  _ctx: ToolContext,
  repo: string,
  prNumber: number,
  comment: string
): Promise<Comment> {
  const data = (await githubFetch(
    `/repos/${repo}/issues/${prNumber}/comments`,
    { method: "POST", body: { body: comment } }
  )) as Record<string, unknown>;

  return {
    id: data.id as number,
    author: ((data.user as Record<string, unknown>)?.login as string) ?? "unknown",
    body: data.body as string,
    createdAt: data.created_at as string,
  };
}

/**
 * Get file contents from a repository.
 */
export async function getFileContents(
  _ctx: ToolContext,
  repo: string,
  filePath: string,
  ref?: string
): Promise<string> {
  const refParam = ref ? `?ref=${ref}` : "";
  const data = (await githubFetch(
    `/repos/${repo}/contents/${filePath}${refParam}`
  )) as Record<string, unknown>;

  // Content is base64 encoded
  if (data.encoding === "base64" && typeof data.content === "string") {
    return Buffer.from(data.content, "base64").toString("utf-8");
  }

  return JSON.stringify(data);
}

/**
 * Create an issue.
 */
export async function createIssue(
  _ctx: ToolContext,
  repo: string,
  title: string,
  body: string
): Promise<Issue> {
  const data = (await githubFetch(`/repos/${repo}/issues`, {
    method: "POST",
    body: { title, body },
  })) as Record<string, unknown>;

  return {
    number: data.number as number,
    title: data.title as string,
    body: data.body as string,
    state: data.state as "open" | "closed",
    labels: ((data.labels as Array<Record<string, unknown>>)?.map(
      (l) => l.name as string
    )) ?? [],
    author: ((data.user as Record<string, unknown>)?.login as string) ?? "unknown",
    createdAt: data.created_at as string,
  };
}

// ─── Tool Dispatcher ───────────────────────────────────────────

export type GitHubToolName = keyof typeof GITHUB_TOOLS;

export async function executeGithubTool(
  toolName: GitHubToolName,
  ctx: ToolContext,
  input: Record<string, unknown>
): Promise<unknown> {
  switch (toolName) {
    case "get_repository":
      return getRepository(ctx, input.repo as string);
    case "list_prs":
      return listPrs(ctx, input.repo as string, input.state as string);
    case "get_pr_details":
      return getPrDetails(ctx, input.repo as string, input.prNumber as number);
    case "create_pr":
      return createPr(
        ctx, input.repo as string, input.title as string,
        input.body as string, input.head as string, input.base as string
      );
    case "comment_on_pr":
      return commentOnPr(
        ctx, input.repo as string, input.prNumber as number, input.comment as string
      );
    case "get_file_contents":
      return getFileContents(
        ctx, input.repo as string, input.path as string, input.ref as string | undefined
      );
    case "create_issue":
      return createIssue(
        ctx, input.repo as string, input.title as string, input.body as string
      );
    default:
      throw new Error(`Unknown GitHub tool: ${toolName}`);
  }
}
