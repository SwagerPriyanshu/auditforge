// ─── Session ───────────────────────────────────────────────────

export type SessionStatus =
  | "created" | "planning" | "gathering_evidence" | "forming_hypotheses"
  | "testing_hypotheses" | "reaching_conclusion" | "awaiting_approval"
  | "executing_action" | "verifying_outcome" | "generating_report"
  | "completed" | "failed" | "aborted";

export interface Session {
  id: string;
  title: string;
  incident: string;
  status: SessionStatus;
  model: string;
  mcpServers: string[];
  createdAt: string;
  updatedAt: string;
  auditEntryCount?: number;
  merkleRoot?: string;
}

// ─── Audit Entry ───────────────────────────────────────────────

export interface AuditEntry {
  id: string;
  sessionId: string;
  timestamp: string;
  toolName: string;
  toolCategory: string;
  toolInput: string;
  toolOutput: string;
  outputTruncated: boolean;
  riskScore: number;
  riskLevel: string;
  riskReasons: string[];
  approved: boolean;
  approvedBy: string | null;
  approvalDecision: string | null;
  actionTaken: string;
  evidenceHash: string;
  parentHash: string | null;
}

// ─── Evidence ──────────────────────────────────────────────────

export interface Evidence {
  id: string;
  source: string;
  content: unknown;
  timestamp: string;
  confidence: number;
  provenance: string;
}

// ─── Hypothesis ────────────────────────────────────────────────

export interface Hypothesis {
  id: string;
  description: string;
  evidenceSupporting: string[];
  evidenceContradicting: string[];
  confidence: number;
  status: string;
}

// ─── Conclusion ────────────────────────────────────────────────

export interface Conclusion {
  hypothesisId: string;
  summary: string;
  confidence: number;
  recommendedAction: unknown | null;
  evidenceChain: string[];
}

// ─── Approval ──────────────────────────────────────────────────

export interface ApprovalRequest {
  id: string;
  sessionId: string;
  toolName: string;
  input: Record<string, unknown>;
  riskScore: number;
  explanation: string;
  timestamp: string;
  suggestedAlternative: string | null;
  consequences: {
    reversible: boolean;
    affectedResources: string[];
    worstCase: string;
    bestCase: string;
    mitigationSteps: string[];
  };
}

// ─── Agent Event ───────────────────────────────────────────────

export type AgentEventType =
  | "thinking" | "plan_created" | "evidence_collected"
  | "hypothesis_formed" | "hypothesis_tested" | "conclusion_reached"
  | "approval_request" | "approval_decision" | "action_executed"
  | "outcome_verified" | "report_generated" | "tool_call"
  | "tool_result" | "message" | "error" | "complete";

export interface AgentEvent {
  id: string;
  sessionId: string;
  type: AgentEventType;
  timestamp: string;
  data: Record<string, unknown>;
}

// ─── Attestation ───────────────────────────────────────────────

export interface Attestation {
  sessionId: string;
  merkleRoot: string;
  leafCount: number;
  createdAt: string;
  blockHash: string;
}
