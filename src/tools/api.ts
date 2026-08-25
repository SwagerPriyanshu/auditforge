/**
 * AuditForge — HTTP API Tools
 *
 * Generic HTTP client for calling external APIs.
 * All requests are logged and risk-scored.
 *
 * Risk scores:
 *   api_get: 3    (low — read-only HTTP)
 *   api_post: 6   (moderate — writes data externally)
 */

// ─── Types ─────────────────────────────────────────────────────

export interface ToolContext {
  sessionId: string;
  userId?: string;
}

export interface ApiResponse {
  url: string;
  method: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  durationMs: number;
}

// ─── Tool Definitions ──────────────────────────────────────────

export const API_TOOLS = {
  api_get: {
    riskScore: 3,
    description: "Make an HTTP GET request",
    category: "network" as const,
  },
  api_post: {
    riskScore: 6,
    description: "Make an HTTP POST request",
    category: "network" as const,
  },
};

// ─── Blocked URLs ──────────────────────────────────────────────

const BLOCKED_URLS = [
  /localhost:(?:3000|3001|8080|8790)/,  // Block self-referencing
  /127\.0\.0\.1/,
  /0\.0\.0\.0/,
];

// ─── Implementations ───────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 15_000;

function validateUrl(url: string): void {
  const parsed = new URL(url);

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Only HTTP/HTTPS URLs are allowed, got: ${parsed.protocol}`);
  }

  for (const pattern of BLOCKED_URLS) {
    if (pattern.test(url)) {
      throw new Error(`URL blocked by security policy: ${url}`);
    }
  }
}

/**
 * Make an HTTP GET request.
 */
export async function apiGet(
  _ctx: ToolContext,
  url: string,
  headers?: Record<string, string>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<ApiResponse> {
  validateUrl(url);
  const startTime = Date.now();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...headers,
      },
      signal: controller.signal,
    });

    const body = await response.json().catch(() => response.text());

    // Extract response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      url,
      method: "GET",
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body,
      durationMs: Date.now() - startTime,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Make an HTTP POST request.
 */
export async function apiPost(
  _ctx: ToolContext,
  url: string,
  body: unknown,
  headers?: Record<string, string>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<ApiResponse> {
  validateUrl(url);
  const startTime = Date.now();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const responseBody = await response.json().catch(() => response.text());

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      url,
      method: "POST",
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      durationMs: Date.now() - startTime,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Tool Dispatcher ───────────────────────────────────────────

export type ApiToolName = keyof typeof API_TOOLS;

export async function executeApiTool(
  toolName: ApiToolName,
  ctx: ToolContext,
  input: Record<string, unknown>
): Promise<ApiResponse> {
  const url = input.url as string;
  const headers = input.headers as Record<string, string> | undefined;

  if (!url) {
    throw new Error("API tool requires a 'url' parameter");
  }

  switch (toolName) {
    case "api_get":
      return apiGet(ctx, url, headers);
    case "api_post":
      return apiPost(ctx, url, input.body, headers);
    default:
      throw new Error(`Unknown API tool: ${toolName}`);
  }
}
