/**
 * AuditForge — Core Type Definitions
 *
 * Single source of truth for every data structure in the system.
 * Each interface maps to a table in SQLite and a concept in the
 * investigation loop.
 */

// ─── Sessions ──────────────────────────────────────────────────

export type SessionStatus =
  | "created"
  | "planning"
  | "gathering_evidence"
  | "forming_hypotheses"
  | "testing_hypotheses"
  | "reaching_conclusion"
  | "awaiting_approval"
  | "executing_action"
  | "verifying_outcome"
  | "generating_report"
  | "completed"
  | "failed"
  | "aborted";

export interface Session {
  id: string;
  title: string;
  incident: string;
  status: SessionStatus;
  model: string;
  mcpServers: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Investigation Plan ────────────────────────────────────────

export interface InvestigationStep {
  id: string;
  description: string;
  toolRequired: string;
  riskScore: number;
  status: "pending" | "in_progress" | "completed" | "failed" | "skipped";
  evidenceIds: string[];
}

export interface InvestigationPlan {
  steps: InvestigationStep[];
  toolsNeeded: string[];
  estimatedRisk: number;
  hypothesisCount: number;
}

// ─── Evidence ──────────────────────────────────────────────────

export interface Evidence {
  id: string;
  source: string;         // Which tool provided it
  content: unknown;       // Raw tool output
  timestamp: string;
  confidence: number;     // 0-1: How reliable is this evidence?
  provenance: string;     // How it was obtained (tool + args + context)
}

// ─── Hypotheses ────────────────────────────────────────────────

export interface Hypothesis {
  id: string;
  description: string;
  evidenceSupporting: string[];    // Evidence IDs
  evidenceContradicting: string[]; // Evidence IDs
  confidence: number;              // 0-1
  status: "proposed" | "investigating" | "confirmed" | "rejected" | "inconclusive";
}

// ─── Test Results ──────────────────────────────────────────────

export interface TestResult {
  hypothesisId: string;
  supported: boolean;
  newEvidenceIds: string[];
  updatedConfidence: number;
  reasoning: string;
  needsMoreEvidence: boolean;
}

// ─── Conclusion ────────────────────────────────────────────────

export interface Conclusion {
  hypothesisId: string;
  summary: string;
  confidence: number;
  recommendedAction: Action | null;
  evidenceChain: string[];   // Ordered evidence IDs supporting conclusion
}

// ─── Actions ───────────────────────────────────────────────────

export type ActionCategory =
  | "read"
  | "write"
  | "execute"
  | "deploy"
  | "notify"
  | "rollback"
  | "create"
  | "delete";

export interface Action {
  id: string;
  category: ActionCategory;
  description: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  riskScore: number;           // 1-10
  rationale: string;           // Why this action is recommended
  reversible: boolean;
}

export interface ActionResult {
  actionId: string;
  success: boolean;
  output: unknown;
  error?: string;
  durationMs: number;
}

export interface VerificationResult {
  actionId: string;
  verified: boolean;
  expected: string;
  actual: string;
  passed: boolean;
  notes: string;
}

export interface ApprovalResult {
  actionId: string;
  approved: boolean;
  approvedBy: string | null;
  decision: string | null;
  timestamp: string;
}

// ─── Audit Report ──────────────────────────────────────────────

export interface TimelineEntry {
  timestamp: string;
  event: string;
  details: string;
  riskScore?: number;
}

export interface AuditReport {
  sessionId: string;
  incident: string;
  timeline: TimelineEntry[];
  evidenceLog: Evidence[];
  hypotheses: Hypothesis[];
  conclusion: Conclusion;
  actionsTaken: Action[];
  attestation: string;   // Merkle root hash
}

// ─── Audit Entries (SQLite) ────────────────────────────────────

export type ToolCategory =
  | "read"
  | "write"
  | "execute"
  | "network"
  | "approval"
  | "system";

export type RiskLevel = "safe" | "low" | "medium" | "high" | "critical";

export interface AuditEntry {
  id: string;
  sessionId: string;
  timestamp: string;
  toolName: string;
  toolCategory: ToolCategory;
  toolInput: string;
  toolOutput: string;
  outputTruncated: boolean;
  riskScore: number;
  riskLevel: RiskLevel;
  riskReasons: string[];
  approved: boolean;
  approvedBy: string | null;
  approvalDecision: string | null;
  approvalTimestamp: string | null;
  actionTaken: "executed" | "skipped" | "denied" | "pending";
  evidenceHash: string;
  parentHash: string | null;
}

// ─── Attestations ──────────────────────────────────────────────

export interface Attestation {
  sessionId: string;
  merkleRoot: string;
  leafCount: number;
  createdAt: string;
  blockHash: string;
}

export interface MerkleProof {
  leafIndex: number;
  leafHash: string;
  proof: string[];
  root: string;
}

// ─── Risk Assessment ───────────────────────────────────────────

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  reasons: string[];
  autoApprove: boolean;
  requiresApproval: boolean;
  isCritical: boolean;
}

// ─── Approval Requests ─────────────────────────────────────────

export type ApprovalStatus = "pending" | "granted" | "denied" | "timeout";

export interface ApprovalRequest {
  id: string;
  sessionId: string;
  auditEntryId: string;
  toolName: string;
  toolInput: string;
  riskScore: number;
  riskLevel: RiskLevel;
  riskReasons: string[];
  status: ApprovalStatus;
  createdAt: string;
  decidedAt: string | null;
  decision: string | null;
}

// ─── Agent Events (SSE streaming) ──────────────────────────────

export type AgentEventType =
  | "thinking"
  | "plan_created"
  | "evidence_collected"
  | "hypothesis_formed"
  | "hypothesis_tested"
  | "conclusion_reached"
  | "approval_request"
  | "approval_decision"
  | "action_executed"
  | "outcome_verified"
  | "report_generated"
  | "tool_call"
  | "tool_result"
  | "message"
  | "error"
  | "complete";

export interface AgentEvent {
  id: string;
  sessionId: string;
  type: AgentEventType;
  timestamp: string;
  data: unknown;
}
