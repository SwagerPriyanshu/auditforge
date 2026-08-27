/**
 * AuditForge — SQLite Audit Storage (sql.js)
 *
 * Uses sql.js (SQLite compiled to WebAssembly) for cross-platform
 * compatibility without native compilation. The API is nearly
 * identical to better-sqlite3 but uses a thin wrapper.
 *
 * Tables:
 *   sessions     — Investigation sessions
 *   audit_entries — Every tool call, with risk scores, approval state, and evidence hashes
 *   attestations — Merkle tree roots for cryptographic verification
 *   approvals    — Pending and resolved approval requests
 */

import initSqlJs, { type Database } from "sql.js";
import path from "path";
import fs from "fs";
import type {
  Session,
  AuditEntry,
  Attestation,
  ApprovalRequest,
} from "../types";

// ─── Database Setup ────────────────────────────────────────────

const DB_PATH = process.env.AUDIT_DB_PATH ?? "./data/audit.db";

let db: Database | null = null;
let dbPath: string = "";

export async function getDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();
  dbPath = path.resolve(DB_PATH);

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run("PRAGMA journal_mode = WAL");
  db.run("PRAGMA foreign_keys = ON");
  initializeSchema(db);

  return db;
}

function saveDb(): void {
  if (db && dbPath) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

function initializeSchema(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      incident TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'created',
      model TEXT NOT NULL,
      mcp_servers TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS audit_entries (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      tool_name TEXT NOT NULL,
      tool_category TEXT NOT NULL,
      tool_input TEXT NOT NULL DEFAULT '{}',
      tool_output TEXT NOT NULL DEFAULT '{}',
      output_truncated INTEGER NOT NULL DEFAULT 0,
      risk_score INTEGER NOT NULL DEFAULT 1,
      risk_level TEXT NOT NULL DEFAULT 'safe',
      risk_reasons TEXT NOT NULL DEFAULT '[]',
      approved INTEGER NOT NULL DEFAULT 0,
      approved_by TEXT,
      approval_decision TEXT,
      approval_timestamp TEXT,
      action_taken TEXT NOT NULL DEFAULT 'pending',
      evidence_hash TEXT NOT NULL,
      parent_hash TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS attestations (
      session_id TEXT PRIMARY KEY,
      merkle_root TEXT NOT NULL,
      leaf_count INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      block_hash TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      audit_entry_id TEXT NOT NULL,
      tool_name TEXT NOT NULL,
      tool_input TEXT NOT NULL,
      risk_score INTEGER NOT NULL,
      risk_level TEXT NOT NULL,
      risk_reasons TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      decided_at TEXT,
      decision TEXT
    )
  `);

  saveDb();
}

// ─── Helper: Run query and return rows ─────────────────────────

function queryAll(db: Database, sql: string, params: unknown[] = []): Record<string, unknown>[] {
  const stmt = db.prepare(sql);
  stmt.bind(params as (string | number | Uint8Array | null)[]);
  const rows: Record<string, unknown>[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryOne(db: Database, sql: string, params: unknown[] = []): Record<string, unknown> | undefined {
  const rows = queryAll(db, sql, params);
  return rows.length > 0 ? rows[0] : undefined;
}

// ─── Session Operations ────────────────────────────────────────

export const SessionStore = {
  async create(session: Session): Promise<void> {
    const d = await getDb();
    d.run(
      `INSERT INTO sessions (id, title, incident, status, model, mcp_servers, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [session.id, session.title, session.incident, session.status, session.model,
       JSON.stringify(session.mcpServers), session.createdAt, session.updatedAt]
    );
    saveDb();
  },

  async get(id: string): Promise<Session | undefined> {
    const d = await getDb();
    const row = queryOne(d, "SELECT * FROM sessions WHERE id = ?", [id]);
    if (!row) return undefined;
    return {
      id: row.id as string,
      title: row.title as string,
      incident: row.incident as string,
      status: row.status as Session["status"],
      model: row.model as string,
      mcpServers: JSON.parse(row.mcp_servers as string),
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  },

  async getAll(): Promise<Session[]> {
    const d = await getDb();
    const rows = queryAll(d, "SELECT * FROM sessions ORDER BY created_at DESC");
    return rows.map((row) => ({
      id: row.id as string,
      title: row.title as string,
      incident: row.incident as string,
      status: row.status as Session["status"],
      model: row.model as string,
      mcpServers: JSON.parse(row.mcp_servers as string),
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }));
  },

  async updateStatus(id: string, status: Session["status"]): Promise<void> {
    const d = await getDb();
    d.run(
      "UPDATE sessions SET status = ?, updated_at = ? WHERE id = ?",
      [status, new Date().toISOString(), id]
    );
    saveDb();
  },
};

// ─── Audit Entry Operations ────────────────────────────────────

export const AuditEntryStore = {
  async create(entry: AuditEntry): Promise<void> {
    const d = await getDb();
    d.run(
      `INSERT INTO audit_entries (
        id, session_id, timestamp, tool_name, tool_category,
        tool_input, tool_output, output_truncated,
        risk_score, risk_level, risk_reasons,
        approved, approved_by, approval_decision, approval_timestamp,
        action_taken, evidence_hash, parent_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.id, entry.sessionId, entry.timestamp, entry.toolName, entry.toolCategory,
        entry.toolInput, entry.toolOutput, entry.outputTruncated ? 1 : 0,
        entry.riskScore, entry.riskLevel, JSON.stringify(entry.riskReasons),
        entry.approved ? 1 : 0, entry.approvedBy, entry.approvalDecision,
        entry.approvalTimestamp, entry.actionTaken, entry.evidenceHash, entry.parentHash,
      ]
    );
    saveDb();
  },

  async getById(id: string): Promise<AuditEntry | undefined> {
    const d = await getDb();
    const row = queryOne(d, "SELECT * FROM audit_entries WHERE id = ?", [id]);
    if (!row) return undefined;
    return mapEntry(row);
  },

  async getBySession(sessionId: string): Promise<AuditEntry[]> {
    const d = await getDb();
    const rows = queryAll(
      d,
      "SELECT * FROM audit_entries WHERE session_id = ? ORDER BY timestamp ASC",
      [sessionId]
    );
    return rows.map(mapEntry);
  },

  async getLatest(sessionId: string): Promise<AuditEntry | undefined> {
    const d = await getDb();
    const row = queryOne(
      d,
      "SELECT * FROM audit_entries WHERE session_id = ? ORDER BY timestamp DESC LIMIT 1",
      [sessionId]
    );
    if (!row) return undefined;
    return mapEntry(row);
  },

  async updateApproval(
    id: string,
    approved: boolean,
    approvedBy: string | null,
    decision: string | null,
    actionTaken: AuditEntry["actionTaken"]
  ): Promise<void> {
    const d = await getDb();
    d.run(
      `UPDATE audit_entries
       SET approved = ?, approved_by = ?, approval_decision = ?, approval_timestamp = ?, action_taken = ?
       WHERE id = ?`,
      [approved ? 1 : 0, approvedBy, decision, new Date().toISOString(), actionTaken, id]
    );
    saveDb();
  },

  async count(sessionId: string): Promise<number> {
    const d = await getDb();
    const row = queryOne(
      d,
      "SELECT COUNT(*) as count FROM audit_entries WHERE session_id = ?",
      [sessionId]
    );
    return (row?.count as number) ?? 0;
  },
};

function mapEntry(row: Record<string, unknown>): AuditEntry {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    timestamp: row.timestamp as string,
    toolName: row.tool_name as string,
    toolCategory: row.tool_category as AuditEntry["toolCategory"],
    toolInput: row.tool_input as string,
    toolOutput: row.tool_output as string,
    outputTruncated: (row.output_truncated as number) === 1,
    riskScore: row.risk_score as number,
    riskLevel: row.risk_level as AuditEntry["riskLevel"],
    riskReasons: JSON.parse(row.risk_reasons as string),
    approved: (row.approved as number) === 1,
    approvedBy: row.approved_by as string | null,
    approvalDecision: row.approval_decision as string | null,
    approvalTimestamp: row.approval_timestamp as string | null,
    actionTaken: row.action_taken as AuditEntry["actionTaken"],
    evidenceHash: row.evidence_hash as string,
    parentHash: row.parent_hash as string | null,
  };
}

// ─── Attestation Operations ────────────────────────────────────

export const AttestationStore = {
  async save(attestation: Attestation): Promise<void> {
    const d = await getDb();
    d.run(
      `INSERT OR REPLACE INTO attestations (session_id, merkle_root, leaf_count, created_at, block_hash)
       VALUES (?, ?, ?, ?, ?)`,
      [attestation.sessionId, attestation.merkleRoot, attestation.leafCount,
       attestation.createdAt, attestation.blockHash]
    );
    saveDb();
  },

  async get(sessionId: string): Promise<Attestation | undefined> {
    const d = await getDb();
    const row = queryOne(
      d,
      "SELECT * FROM attestations WHERE session_id = ?",
      [sessionId]
    );
    if (!row) return undefined;
    return {
      sessionId: row.session_id as string,
      merkleRoot: row.merkle_root as string,
      leafCount: row.leaf_count as number,
      createdAt: row.created_at as string,
      blockHash: row.block_hash as string,
    };
  },
};

// ─── Approval Operations ───────────────────────────────────────

export const ApprovalStore = {
  async create(request: ApprovalRequest): Promise<void> {
    const d = await getDb();
    d.run(
      `INSERT INTO approvals (id, session_id, audit_entry_id, tool_name, tool_input,
        risk_score, risk_level, risk_reasons, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [request.id, request.sessionId, request.auditEntryId, request.toolName,
       request.toolInput, request.riskScore, request.riskLevel,
       JSON.stringify(request.riskReasons), request.status, request.createdAt]
    );
    saveDb();
  },

  async get(id: string): Promise<ApprovalRequest | undefined> {
    const d = await getDb();
    const row = queryOne(d, "SELECT * FROM approvals WHERE id = ?", [id]);
    if (!row) return undefined;
    return {
      id: row.id as string,
      sessionId: row.session_id as string,
      auditEntryId: row.audit_entry_id as string,
      toolName: row.tool_name as string,
      toolInput: row.tool_input as string,
      riskScore: row.risk_score as number,
      riskLevel: row.risk_level as ApprovalRequest["riskLevel"],
      riskReasons: JSON.parse(row.risk_reasons as string),
      status: row.status as ApprovalRequest["status"],
      createdAt: row.created_at as string,
      decidedAt: row.decided_at as string | null,
      decision: row.decision as string | null,
    };
  },

  async getPending(sessionId: string): Promise<ApprovalRequest[]> {
    const d = await getDb();
    const rows = queryAll(
      d,
      "SELECT * FROM approvals WHERE session_id = ? AND status = 'pending' ORDER BY created_at ASC",
      [sessionId]
    );
    return rows.map((row) => ({
      id: row.id as string,
      sessionId: row.session_id as string,
      auditEntryId: row.audit_entry_id as string,
      toolName: row.tool_name as string,
      toolInput: row.tool_input as string,
      riskScore: row.risk_score as number,
      riskLevel: row.risk_level as ApprovalRequest["riskLevel"],
      riskReasons: JSON.parse(row.risk_reasons as string),
      status: row.status as ApprovalRequest["status"],
      createdAt: row.created_at as string,
      decidedAt: row.decided_at as string | null,
      decision: row.decision as string | null,
    }));
  },

  async decide(id: string, status: "granted" | "denied", decision: string): Promise<void> {
    const d = await getDb();
    d.run(
      "UPDATE approvals SET status = ?, decision = ?, decided_at = ? WHERE id = ?",
      [status, decision, new Date().toISOString(), id]
    );
    saveDb();
  },
};

// ─── Cleanup ───────────────────────────────────────────────────

export function closeDb(): void {
  if (db) {
    saveDb();
    db.close();
    db = null;
  }
}
