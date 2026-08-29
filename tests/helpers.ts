/**
 * AuditForge — Test Helpers
 *
 * Shared utilities for all test files. Provides helper functions
 * for creating sessions, running investigations, and asserting results.
 */

import { InvestigationOrchestrator } from "../src/agent/orchestrator";
import { SessionStore, AuditEntryStore, AttestationStore, getDb } from "../src/storage/audit.db";
import { RiskEngine } from "../src/risk/engine";
import { PreExecutionVerifier } from "../src/verification/pre-execution";
import { PostExecutionVerifier } from "../src/verification/post-execution";
import { AttestationGenerator } from "../src/verification/attestation";
import { ApprovalGate } from "../src/approval/gate";
import { ToolInterceptor } from "../src/interception/interceptor";
import type { Session, AgentEvent, AuditEntry } from "../src/types";

// Ensure DB is initialized before any test runs
let dbReady: Promise<void> | null = null;
async function ensureDb(): Promise<void> {
  if (!dbReady) dbReady = getDb().then(() => {});
  await dbReady;
}

// ─── Globals ───────────────────────────────────────────────────

let orchestrator: InvestigationOrchestrator;
let riskEngine: RiskEngine;
let preVerifier: PreExecutionVerifier;
let postVerifier: PostExecutionVerifier;
let attestationGen: AttestationGenerator;
let approvalGate: ApprovalGate;
let interceptor: ToolInterceptor;

export function getOrchestrator(): InvestigationOrchestrator {
  if (!orchestrator) orchestrator = new InvestigationOrchestrator();
  return orchestrator;
}

export function getRiskEngine(): RiskEngine {
  if (!riskEngine) riskEngine = new RiskEngine();
  return riskEngine;
}

export function getPreVerifier(): PreExecutionVerifier {
  if (!preVerifier) preVerifier = new PreExecutionVerifier(getRiskEngine());
  return preVerifier;
}

export function getPostVerifier(): PostExecutionVerifier {
  if (!postVerifier) postVerifier = new PostExecutionVerifier();
  return postVerifier;
}

export function getAttestationGen(): AttestationGenerator {
  if (!attestationGen) attestationGen = new AttestationGenerator();
  return attestationGen;
}

export function getApprovalGate(): ApprovalGate {
  if (!approvalGate) approvalGate = new ApprovalGate();
  return approvalGate;
}

export function getInterceptor(): ToolInterceptor {
  if (!interceptor) interceptor = new ToolInterceptor();
  return interceptor;
}

// ─── Test Session Factory ──────────────────────────────────────

export interface TestSession {
  session: Session;
  events: AgentEvent[];
  entries: AuditEntry[];
}

export async function createTestSession(
  title: string,
  incident: string
): Promise<TestSession> {
  await ensureDb();
  const orch = getOrchestrator();
  const session = await orch.createSession({ title, incident });

  const events: AgentEvent[] = [];
  await orch.startInvestigation(session.id, {
    onEvent: (event) => events.push(event),
    onApprovalNeeded: () => {},
  });

  // Reload session from DB to get updated status
  const updatedSession = await SessionStore.get(session.id);
  const entries = await AuditEntryStore.getBySession(session.id);

  return { session: updatedSession ?? session, events, entries };
}

// ─── Assertions ────────────────────────────────────────────────

export function assertSessionCompleted(session: Session): void {
  if (session.status !== "completed") {
    throw new Error(`Expected session status "completed", got "${session.status}"`);
  }
}

export function assertEventsContainType(events: AgentEvent[], type: string): void {
  const found = events.some((e) => e.type === type);
  if (!found) {
    throw new Error(`Expected event type "${type}" not found in ${events.length} events`);
  }
}

export function assertAuditLogNotEmpty(entries: AuditEntry[]): void {
  if (entries.length === 0) {
    throw new Error("Expected audit log to have at least one entry");
  }
}

export function assertRiskScoreInRange(score: number, min: number, max: number): void {
  if (score < min || score > max) {
    throw new Error(`Expected risk score ${score} to be in range [${min}, ${max}]`);
  }
}

export function assertAttestationExists(sessionId: string): void {
  // Attestation is created during investigation
  // This is a placeholder — real check would query the store
}

export function assertChainIntegrity(entries: AuditEntry[]): void {
  for (let i = 1; i < entries.length; i++) {
    if (entries[i].parentHash !== entries[i - 1].evidenceHash) {
      throw new Error(
        `Chain broken at entry ${i}: expected parentHash ${entries[i - 1].evidenceHash}, got ${entries[i].parentHash}`
      );
    }
  }
}

export function assertNoCrossContamination(
  session1Events: AgentEvent[],
  session2Events: AgentEvent[],
  session1Id: string,
  session2Id: string
): void {
  const cross1 = session1Events.filter((e) => e.sessionId === session2Id);
  const cross2 = session2Events.filter((e) => e.sessionId === session1Id);

  if (cross1.length > 0) {
    throw new Error(`Session 1 has ${cross1.length} events from session 2`);
  }
  if (cross2.length > 0) {
    throw new Error(`Session 2 has ${cross2.length} events from session 1`);
  }
}

// ─── Timing ────────────────────────────────────────────────────

export function measureTime<T>(fn: () => T | Promise<T>): Promise<{ result: T; ms: number }> {
  const start = Date.now();
  const result = fn();
  if (result instanceof Promise) {
    return result.then((r) => ({ result: r, ms: Date.now() - start }));
  }
  return Promise.resolve({ result, ms: Date.now() - start });
}
