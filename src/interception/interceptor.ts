/**
 * AuditForge — Tool Interceptor
 *
 * The central nervous system of AuditForge. Every tool call
 * passes through this interceptor, which:
 *
 *   1. Generates a unique call ID
 *   2. Logs the call attempt
 *   3. Runs pre-execution verification
 *   4. Scores the risk (1-10)
 *   5. Checks approval requirements
 *   6. Executes the tool
 *   7. Runs post-execution verification
 *   8. Logs the result and creates an audit entry
 *   9. Updates the Merkle tree attestation
 *
 * Nothing gets through without being recorded.
 */

import crypto from "crypto";
import { AuditLogger } from "./logger";
import { RiskEngine } from "../risk/engine";
import { PreExecutionVerifier } from "../verification/pre-execution";
import { PostExecutionVerifier } from "../verification/post-execution";
import { createApprovalRequest } from "../approval/gate";
import { addLeaf } from "../verification/attestation";
import { AuditEntryStore, ApprovalStore } from "../storage/audit.db";
import { getToolDefinition } from "../tools";
import type { AuditEntry, ToolCategory } from "../types";

// ─── Types ─────────────────────────────────────────────────────

export interface InterceptedResult {
  output: unknown;
  verified: boolean;
  issues?: string[];
  auditEntry: AuditEntry;
}

export interface InterceptionContext {
  sessionId: string;
  userId?: string;
  approvalOverride?: {
    approvedBy: string;
    decision?: string;
  };
}

// ─── Tool Interceptor ──────────────────────────────────────────

export class ToolInterceptor {
  private logger = new AuditLogger();
  private riskEngine = new RiskEngine();
  private preVerifier = new PreExecutionVerifier(this.riskEngine);
  private postVerifier = new PostExecutionVerifier();

  /**
   * Intercept a tool call. This is the single entry point for
   * all tool invocations in the system.
   *
   * Flow:
   *   callId = generate
   *   → logCall
   *   → preExecutionVerify
   *   → riskScore
   *   → approvalCheck (if risk > threshold)
   *   → execute
   *   → postExecutionVerify
   *   → logResult
   *   → createAuditEntry
   *   → addLeaf (Merkle tree)
   */
  async intercept(
    ctx: InterceptionContext,
    toolName: string,
    input: Record<string, unknown>,
    execute: () => Promise<unknown>
  ): Promise<InterceptedResult> {
    const callId = this.generateCallId();

    // 1. Log the tool call (before execution)
    await this.logger.logCall(ctx.sessionId, callId, toolName, input);

    // 2. Pre-execution verification
    const preResult = await this.preVerifier.verify(toolName, input, ctx.sessionId);

    if (!preResult.valid) {
      await this.logger.logBlocked(ctx.sessionId, callId, preResult.reason ?? "Pre-execution check failed");
      throw new Error(`Blocked: ${preResult.reason}`);
    }

    // 3. Risk scoring
    const assessment = this.riskEngine.assess(toolName, input);
    await this.logger.logRisk(ctx.sessionId, callId, assessment.score);

    // 4. Approval check (if risk > 3)
    let approved = assessment.autoApprove;
    let approvedBy: string | null = assessment.autoApprove ? "auto" : null;

    if (assessment.requiresApproval && ctx.approvalOverride) {
      approved = true;
      approvedBy = ctx.approvalOverride.approvedBy;
    }

    if (assessment.requiresApproval && !approved) {
      const approvalRequest = createApprovalRequest(
        ctx.sessionId,
        callId,
        toolName,
        input,
        assessment
      );
      await ApprovalStore.create(approvalRequest);
      await this.logger.logApproval(ctx.sessionId, callId, false);

      // In simulation, auto-approve for demo purposes
      // In production, this would pause and wait for human input
      approved = assessment.score <= 5; // Auto-approve medium and below
      approvedBy = approved ? "auto-simulated" : null;

      if (!approved) {
        await this.logger.logDenied(ctx.sessionId, callId);
        throw new Error(`Approval required for ${toolName} (risk: ${assessment.score}/10) — denied in simulation mode`);
      }
    }

    // 5. Execute the tool
    let output: unknown;
    let success = true;
    let error: string | undefined;

    try {
      output = await execute();
      await this.logger.logOutput(ctx.sessionId, callId, output);
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : String(err);
      output = { error };
      await this.logger.logError(ctx.sessionId, callId, err);
    }

    // 6. Post-execution verification
    const postResult = await this.postVerifier.verify(toolName, input, output);

    let verified = postResult.verified;
    let issues: string[] | undefined;

    if (!verified || postResult.warnings.length > 0) {
      issues = [...postResult.issues, ...postResult.warnings];
      await this.logger.logVerificationFailed(ctx.sessionId, callId, issues);
    }

    // 7. Create audit entry
    const category = (getToolDefinition(toolName)?.category ?? "system") as ToolCategory;
    const entryId = `entry-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

    const latestEntry = await AuditEntryStore.getLatest(ctx.sessionId);
    const parentHash = latestEntry?.evidenceHash ?? null;

    const toolInputJson = JSON.stringify(input);
    const toolOutputJson = JSON.stringify(output);
    const evidenceHash = this.computeEvidenceHash(toolName, toolInputJson, toolOutputJson, assessment.score);

    const auditEntry: AuditEntry = {
      id: entryId,
      sessionId: ctx.sessionId,
      timestamp: new Date().toISOString(),
      toolName,
      toolCategory: category,
      toolInput: toolInputJson,
      toolOutput: toolOutputJson,
      outputTruncated: toolOutputJson.length > 1_048_576,
      riskScore: assessment.score,
      riskLevel: assessment.level,
      riskReasons: assessment.reasons,
      approved,
      approvedBy,
      approvalDecision: approved
        ? ctx.approvalOverride?.decision ?? "auto"
        : null,
      approvalTimestamp: approved ? new Date().toISOString() : null,
      actionTaken: success ? "executed" : approved ? "executed" : "pending",
      evidenceHash,
      parentHash,
    };

    await AuditEntryStore.create(auditEntry);

    // 8. Update Merkle tree
    addLeaf(ctx.sessionId, evidenceHash);

    return { output, verified, issues, auditEntry };
  }

  // ─── Helpers ──────────────────────────────────────────────

  private generateCallId(): string {
    return `call-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  }

  private computeEvidenceHash(
    toolName: string,
    input: string,
    output: string,
    riskScore: number
  ): string {
    const payload = `${toolName}:${input}:${output}:${riskScore}`;
    return crypto.createHash("sha256").update(payload).digest("hex");
  }
}

// ─── Singleton ─────────────────────────────────────────────────

export const interceptor = new ToolInterceptor();

/**
 * Convenience function: intercept and execute a tool call.
 */
export async function interceptToolCall(
  ctx: InterceptionContext,
  toolName: string,
  input: Record<string, unknown>,
  execute: () => Promise<unknown>
): Promise<InterceptedResult> {
  return interceptor.intercept(ctx, toolName, input, execute);
}

/**
 * Approve a pending tool call (called from API).
 */
export async function approveToolCall(
  approvalId: string,
  decision: "granted" | "denied",
  userId: string = "user"
): Promise<{ entryId: string; approved: boolean } | null> {
  const approvalRequest = await ApprovalStore.get(approvalId);
  if (!approvalRequest || approvalRequest.status !== "pending") {
    return null;
  }

  await ApprovalStore.decide(approvalId, decision, `Decision by ${userId}`);
  const approved = decision === "granted";

  await AuditEntryStore.updateApproval(
    approvalRequest.auditEntryId,
    approved,
    `user:${userId}`,
    decision,
    approved ? "executed" : "denied"
  );

  return { entryId: approvalRequest.auditEntryId, approved };
}
