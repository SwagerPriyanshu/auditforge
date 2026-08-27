/**
 * AuditForge — Human Approval Gate
 *
 * The safety mechanism that prevents the agent from taking
 * irreversible actions without human consent.
 *
 * Flow:
 *   1. Agent wants to call a high-risk tool
 *   2. Risk engine scores the action (risk > 3)
 *   3. Approval gate creates a request with consequences
 *   4. Gate emits the request and waits (with timeout)
 *   5. Human reviews and responds: approve / deny / modify
 *   6. Gate resolves, agent loop resumes with the decision
 *
 * This is what separates an agent from a chatbot:
 * the agent stops and asks before doing something you can't undo.
 */

import crypto from "crypto";
import { AuditLogger, logger } from "../interception/logger";
import type { RiskScore } from "../risk/engine";

// ─── Types ─────────────────────────────────────────────────────

export interface ApprovalRequest {
  id: string;
  sessionId: string;
  toolName: string;
  input: Record<string, unknown>;
  riskScore: number;
  explanation: string;
  timestamp: string;
  suggestedAlternative: string | null;
  consequences: ConsequenceDescription;
}

export interface ConsequenceDescription {
  reversible: boolean;
  affectedResources: string[];
  worstCase: string;
  bestCase: string;
  mitigationSteps: string[];
}

export interface PendingApproval {
  request: ApprovalRequest;
  resolved: boolean;
  approved: boolean;
  modifiedInput?: Record<string, unknown>;
  decidedBy?: string;
  decidedAt?: string;
  reason?: string;
}

export type ApprovalDecision = "approve" | "deny" | "modify";

// ─── Event System ──────────────────────────────────────────────

type ApprovalListener = (request: ApprovalRequest) => void;

// ─── Approval Gate ─────────────────────────────────────────────

export class ApprovalGate {
  private pendingApprovals = new Map<string, PendingApproval>();
  private listeners = new Map<string, ApprovalListener[]>();
  private auditLogger = new AuditLogger();

  /**
   * Request human approval for a tool call.
   *
   * Creates an approval request, emits it to listeners, and
   * waits for a response (with timeout).
   *
   * Returns true if approved, false if denied or timed out.
   */
  async requestApproval(
    sessionId: string,
    callId: string,
    toolName: string,
    input: Record<string, unknown>,
    riskScore: RiskScore
  ): Promise<boolean> {
    // 1. Create approval request
    const request = this.createApprovalRequest(sessionId, callId, toolName, input, riskScore);

    // 2. Store pending
    this.pendingApprovals.set(callId, {
      request,
      resolved: false,
      approved: false,
    });

    // 3. Emit approval request to listeners
    await this.emitApprovalRequest(request);

    // 4. Wait for response (with 60s timeout)
    try {
      const approved = await this.waitForResponse(callId, 60_000);
      return approved;
    } catch (err) {
      // Timeout or error — deny by default
      logger.warn("Approval", `Approval ${err instanceof Error && err.message.includes("timeout") ? "timed out" : "failed"} for ${toolName}`, {
        sessionId, callId, toolName,
      });
      return false;
    } finally {
      // 5. Clean up
      this.pendingApprovals.delete(callId);
    }
  }

  /**
   * Respond to an approval request.
   *
   * Called by the API when a human makes a decision.
   */
  async respond(
    sessionId: string,
    callId: string,
    decision: ApprovalDecision,
    modifiedInput?: Record<string, unknown>,
    userId?: string,
    reason?: string
  ): Promise<{ approved: boolean; modifiedInput?: Record<string, unknown> }> {
    const pending = this.pendingApprovals.get(callId);
    if (!pending) {
      throw new Error(`No pending approval for ${callId}`);
    }

    if (pending.resolved) {
      throw new Error(`Approval ${callId} already decided`);
    }

    pending.resolved = true;
    pending.approved = decision === "approve" || decision === "modify";
    pending.decidedBy = userId ?? "unknown";
    pending.decidedAt = new Date().toISOString();
    pending.reason = reason;

    if (decision === "modify" && modifiedInput) {
      pending.modifiedInput = modifiedInput;
    }

    // Log the decision
    await this.auditLogger.logApproval(sessionId, callId, pending.approved);

    logger.info("Approval", `${decision} for ${pending.request.toolName}`, {
      sessionId,
      callId,
      decision,
      decidedBy: pending.decidedBy,
    });

    return {
      approved: pending.approved,
      modifiedInput: pending.modifiedInput,
    };
  }

  /**
   * Get all pending approvals for a session.
   */
  getPendingApprovals(sessionId: string): ApprovalRequest[] {
    const pending: ApprovalRequest[] = [];
    for (const [, approval] of this.pendingApprovals) {
      if (!approval.resolved && approval.request.sessionId === sessionId) {
        pending.push(approval.request);
      }
    }
    return pending;
  }

  /**
   * Get a specific pending approval.
   */
  getPending(callId: string): PendingApproval | undefined {
    return this.pendingApprovals.get(callId);
  }

  /**
   * Subscribe to approval requests for a session.
   * Returns an unsubscribe function.
   */
  onRequest(sessionId: string, listener: ApprovalListener): () => void {
    if (!this.listeners.has(sessionId)) {
      this.listeners.set(sessionId, []);
    }
    this.listeners.get(sessionId)!.push(listener);

    return () => {
      const list = this.listeners.get(sessionId);
      if (list) {
        const idx = list.indexOf(listener);
        if (idx >= 0) list.splice(idx, 1);
      }
    };
  }

  /**
   * Check if a call has a pending approval.
   */
  isPending(callId: string): boolean {
    const pending = this.pendingApprovals.get(callId);
    return pending !== undefined && !pending.resolved;
  }

  /**
   * Get the total number of pending approvals across all sessions.
   */
  getPendingCount(): number {
    let count = 0;
    for (const [, approval] of this.pendingApprovals) {
      if (!approval.resolved) count++;
    }
    return count;
  }

  // ─── Private Methods ─────────────────────────────────────

  private createApprovalRequest(
    sessionId: string,
    callId: string,
    toolName: string,
    input: Record<string, unknown>,
    riskScore: RiskScore
  ): ApprovalRequest {
    return {
      id: callId,
      sessionId,
      toolName,
      input,
      riskScore: riskScore.score,
      explanation: riskScore.explanation,
      timestamp: new Date().toISOString(),
      suggestedAlternative: this.suggestAlternative(toolName, input),
      consequences: this.describeConsequences(toolName, input),
    };
  }

  private async emitApprovalRequest(request: ApprovalRequest): Promise<void> {
    const sessionListeners = this.listeners.get(request.sessionId) ?? [];
    for (const listener of sessionListeners) {
      try {
        listener(request);
      } catch {
        // Listener error doesn't block the gate
      }
    }

    logger.warn("Approval", `Requesting approval for ${request.toolName} (risk: ${request.riskScore}/10)`, {
      sessionId: request.sessionId,
      callId: request.id,
      toolName: request.toolName,
      riskScore: request.riskScore,
      reversible: request.consequences.reversible,
    });
  }

  private waitForResponse(callId: string, timeoutMs: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Approval timeout for ${callId} after ${timeoutMs}ms`));
      }, timeoutMs);

      const check = () => {
        const pending = this.pendingApprovals.get(callId);
        if (!pending) {
          clearTimeout(timeout);
          reject(new Error(`Approval ${callId} was removed`));
          return;
        }

        if (pending.resolved) {
          clearTimeout(timeout);
          resolve(pending.approved);
        } else {
          setTimeout(check, 100);
        }
      };

      check();
    });
  }

  private suggestAlternative(toolName: string, input: Record<string, unknown>): string | null {
    const alternatives: Record<string, (input: Record<string, unknown>) => string> = {
      delete_file: () => `Use write_file to move ${input.path} to a backup location instead`,
      exec: () => `Use exec_safe to run a sanitized version of this command`,
      merge_pr: () => `Use comment_on_pr to leave a review instead of merging`,
      api_post: () => `Use api_get to verify the endpoint first`,
      write_file: () => {
        const path = String(input.path ?? "");
        if (path.includes("config")) return "Consider using a feature flag instead of modifying config directly";
        return "Review the file contents before approving the write";
      },
    };

    const suggester = alternatives[toolName];
    return suggester ? suggester(input) : null;
  }

  private describeConsequences(toolName: string, input: Record<string, unknown>): ConsequenceDescription {
    const consequencesByTool: Record<string, () => ConsequenceDescription> = {
      delete_file: () => ({
        reversible: false,
        affectedResources: [String(input.path ?? "unknown file")],
        worstCase: "Permanent data loss. File may contain critical configuration or data.",
        bestCase: "File is removed and can be restored from version control.",
        mitigationSteps: [
          "Ensure file is committed to version control",
          "Create a backup before deletion",
          "Verify no other process depends on this file",
        ],
      }),
      write_file: () => ({
        reversible: true,
        affectedResources: [String(input.path ?? "unknown file")],
        worstCase: "File contents overwritten. Previous version lost if not backed up.",
        bestCase: "File updated successfully. Backup created automatically.",
        mitigationSteps: [
          "AuditForge creates a .bak backup automatically",
          "Verify the change is correct before approving",
        ],
      }),
      exec: () => ({
        reversible: false,
        affectedResources: ["System state", "Process list", "File system"],
        worstCase: "Command executes with full system access. Could modify, delete, or expose data.",
        bestCase: "Command runs and produces output without side effects.",
        mitigationSteps: [
          "Review the exact command before approving",
          "Consider using exec_safe instead",
          "Ensure the command is scoped to the workspace",
        ],
      }),
      merge_pr: () => ({
        reversible: false,
        affectedResources: [String(input.repo ?? "repository"), `PR #${input.prNumber ?? "?"}`],
        worstCase: "Code is merged into the target branch. May break builds or introduce bugs.",
        bestCase: "PR is merged and all checks pass.",
        mitigationSteps: [
          "Review the PR diff before approving",
          "Ensure CI checks have passed",
          "Verify the target branch is correct",
        ],
      }),
      create_pr: () => ({
        reversible: true,
        affectedResources: [String(input.repo ?? "repository")],
        worstCase: "PR is created with incorrect changes or targeting wrong branch.",
        bestCase: "PR is created and ready for review.",
        mitigationSteps: [
          "Review the PR title and description",
          "Verify the source and target branches",
        ],
      }),
      api_post: () => ({
        reversible: false,
        affectedResources: [String(input.url ?? "external API")],
        worstCase: "Data is sent to an external service. May create records or trigger actions.",
        bestCase: "API call succeeds and returns expected response.",
        mitigationSteps: [
          "Verify the endpoint URL is correct",
          "Check the request body for sensitive data",
          "Consider using api_get to test the endpoint first",
        ],
      }),
    };

    const describer = consequencesByTool[toolName];
    if (describer) return describer();

    // Default consequences
    return {
      reversible: false,
      affectedResources: ["Unknown"],
      worstCase: "Action may have unintended side effects.",
      bestCase: "Action completes as expected.",
      mitigationSteps: ["Review the action carefully before approving"],
    };
  }
}

// ─── Singleton ─────────────────────────────────────────────────

export const approvalGate = new ApprovalGate();

/**
 * Convenience: request approval through the singleton gate.
 */
export async function requestApproval(
  sessionId: string,
  callId: string,
  toolName: string,
  input: Record<string, unknown>,
  riskScore: RiskScore
): Promise<boolean> {
  return approvalGate.requestApproval(sessionId, callId, toolName, input, riskScore);
}

/**
 * Convenience: respond to an approval request.
 */
export async function respondToApproval(
  sessionId: string,
  callId: string,
  decision: ApprovalDecision,
  modifiedInput?: Record<string, unknown>,
  userId?: string,
  reason?: string
): Promise<{ approved: boolean; modifiedInput?: Record<string, unknown> }> {
  return approvalGate.respond(sessionId, callId, decision, modifiedInput, userId, reason);
}

/**
 * Legacy compatibility: create an approval request object.
 * Used by the interceptor for backward compatibility.
 */
export function createApprovalRequest(
  sessionId: string,
  auditEntryId: string,
  toolName: string,
  toolInput: Record<string, unknown>,
  assessment: { score: number; level: string; reasons: string[] }
): import("../types").ApprovalRequest {
  return {
    id: `apr-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
    sessionId,
    auditEntryId,
    toolName,
    toolInput: JSON.stringify(toolInput),
    riskScore: assessment.score,
    riskLevel: assessment.level as import("../types").RiskLevel,
    riskReasons: assessment.reasons,
    status: "pending",
    createdAt: new Date().toISOString(),
    decidedAt: null,
    decision: null,
  };
}
