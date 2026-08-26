/**
 * AuditForge — Structured Audit Logger
 *
 * Two exports:
 *   1. AuditLogger — class for detailed per-call logging
 *   2. logger — singleton for component-level logging
 */

import crypto from "crypto";

// ─── Singleton Logger ──────────────────────────────────────────

export const logger = {
  info(component: string, message: string, data?: Record<string, unknown>): void {
    const prefix = `[${new Date().toISOString()}] [INFO] [${component}]`;
    console.log(data ? `${prefix} ${message} ${JSON.stringify(data)}` : `${prefix} ${message}`);
  },
  warn(component: string, message: string, data?: Record<string, unknown>): void {
    const prefix = `[${new Date().toISOString()}] [WARN] [${component}]`;
    console.warn(data ? `${prefix} ${message} ${JSON.stringify(data)}` : `${prefix} ${message}`);
  },
  error(component: string, message: string, data?: Record<string, unknown>): void {
    const prefix = `[${new Date().toISOString()}] [ERROR] [${component}]`;
    console.error(data ? `${prefix} ${message} ${JSON.stringify(data)}` : `${prefix} ${message}`);
  },
  debug(component: string, message: string, data?: Record<string, unknown>): void {
    const prefix = `[${new Date().toISOString()}] [DEBUG] [${component}]`;
    console.log(data ? `${prefix} ${message} ${JSON.stringify(data)}` : `${prefix} ${message}`);
  },
  sessionCreated(session: { id: string; title: string; model: string }): void {
    logger.info("Session", `Created: ${session.title}`, { sessionId: session.id, model: session.model });
  },
  investigationComplete(sessionId: string, entryCount: number, durationMs: number): void {
    logger.info("Investigation", `Complete: ${entryCount} entries in ${durationMs}ms`, { sessionId });
  },
  attestationCreated(sessionId: string, merkleRoot: string, leafCount: number): void {
    logger.info("Attestation", `Merkle root: ${merkleRoot.slice(0, 16)}... (${leafCount} leaves)`, { sessionId });
  },
  shutdown(): void {
    // No-op for now
  },
};

// ─── Log Entry Types ───────────────────────────────────────────

export interface LogEntry {
  id: string;
  sessionId: string;
  callId: string;
  timestamp: string;
  type: LogEntryType;
  toolName: string;
  input?: unknown;
  output?: unknown;
  riskScore?: number;
  approved?: boolean;
  verified?: boolean;
  blocked?: boolean;
  denied?: boolean;
  error?: string;
  issues?: string[];
  hash: string;
  parentHash: string | null;
}

export type LogEntryType =
  | "call"
  | "output"
  | "risk"
  | "approval"
  | "blocked"
  | "denied"
  | "verification_failed"
  | "error";

// ─── Audit Logger Class ────────────────────────────────────────

export class AuditLogger {
  private sessionLogs = new Map<string, LogEntry[]>();

  async logCall(sessionId: string, callId: string, toolName: string, input: unknown): Promise<void> {
    const entry = this.createEntry(sessionId, callId, toolName, "call", { input: this.sanitize(input) });
    this.append(sessionId, entry);
    this.print(entry);
  }

  async logOutput(sessionId: string, callId: string, output: unknown): Promise<void> {
    const entry = this.createEntry(sessionId, callId, "", "output", { output: this.sanitize(output) });
    this.append(sessionId, entry);
    this.print(entry);
  }

  async logRisk(sessionId: string, callId: string, riskScore: number): Promise<void> {
    const entry = this.createEntry(sessionId, callId, "", "risk", { riskScore });
    this.append(sessionId, entry);
    this.print(entry);
  }

  async logApproval(sessionId: string, callId: string, approved: boolean): Promise<void> {
    const entry = this.createEntry(sessionId, callId, "", "approval", { approved });
    this.append(sessionId, entry);
    this.print(entry);
  }

  async logBlocked(sessionId: string, callId: string, reason: string): Promise<void> {
    const entry = this.createEntry(sessionId, callId, "", "blocked", { blocked: true, error: reason });
    this.append(sessionId, entry);
    this.print(entry);
  }

  async logDenied(sessionId: string, callId: string): Promise<void> {
    const entry = this.createEntry(sessionId, callId, "", "denied", { denied: true });
    this.append(sessionId, entry);
    this.print(entry);
  }

  async logVerificationFailed(sessionId: string, callId: string, issues: string[]): Promise<void> {
    const entry = this.createEntry(sessionId, callId, "", "verification_failed", { verified: false, issues });
    this.append(sessionId, entry);
    this.print(entry);
  }

  async logError(sessionId: string, callId: string, error: unknown): Promise<void> {
    const entry = this.createEntry(sessionId, callId, "", "error", {
      error: error instanceof Error ? error.message : String(error),
    });
    this.append(sessionId, entry);
    this.print(entry);
  }

  async getAuditLog(sessionId: string): Promise<LogEntry[]> {
    return this.sessionLogs.get(sessionId) ?? [];
  }

  private createEntry(
    sessionId: string, callId: string, toolName: string,
    type: LogEntryType, data: Record<string, unknown>
  ): LogEntry {
    const existing = this.sessionLogs.get(sessionId) ?? [];
    const parentHash = existing.length > 0 ? existing[existing.length - 1].hash : null;

    const entry: Record<string, unknown> = {
      id: `log-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
      sessionId, callId, timestamp: new Date().toISOString(),
      type, toolName, hash: "", parentHash,
      ...data,
    };

    const hashInput = JSON.stringify({
      sessionId: entry.sessionId, callId: entry.callId,
      timestamp: entry.timestamp, type: entry.type,
      toolName: entry.toolName, riskScore: entry.riskScore,
      input: entry.input, output: entry.output,
    });
    entry.hash = crypto.createHash("sha256").update(hashInput).digest("hex");

    return entry as unknown as LogEntry;
  }

  private append(sessionId: string, entry: LogEntry): void {
    if (!this.sessionLogs.has(sessionId)) {
      this.sessionLogs.set(sessionId, []);
    }
    this.sessionLogs.get(sessionId)!.push(entry);
  }

  private print(entry: LogEntry): void {
    const level = {
      call: "CALL ", output: "OUTPUT", risk: "RISK ",
      approval: "APPRV", blocked: "BLOCK", denied: "DENY ",
      verification_failed: "VERIFY", error: "ERROR",
    }[entry.type] ?? "LOG  ";

    const prefix = `[${entry.timestamp}] [${level}] [${entry.sessionId.slice(0, 8)}]`;
    let detail = "";
    if (entry.toolName) detail += ` ${entry.toolName}`;
    if (entry.riskScore !== undefined) detail += ` risk=${entry.riskScore}`;
    if (entry.blocked) detail += ` BLOCKED: ${entry.error}`;
    if (entry.denied) detail += ` DENIED`;
    if (entry.error && !entry.blocked) detail += ` ERROR: ${entry.error}`;

    console.log(`${prefix}${detail}`);
  }

  private sanitize(data: unknown): unknown {
    if (data === null || data === undefined) return data;
    const str = JSON.stringify(data);
    let sanitized = str
      .replace(/("(?:password|token|api_key|secret|authorization)":\s*")([^"]+)"/gi, '$1[REDACTED]')
      .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [REDACTED]");
    if (sanitized.length > 10_000) {
      sanitized = sanitized.slice(0, 10_000) + "... [truncated]";
    }
    try { return JSON.parse(sanitized); } catch { return sanitized; }
  }
}
