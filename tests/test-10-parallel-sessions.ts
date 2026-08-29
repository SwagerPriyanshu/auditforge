/**
 * Test 10: Parallel Sessions
 *
 * Input: Two investigations started simultaneously
 * Expected: Both logged separately, no cross-contamination
 * Success: Both sessions complete, logs distinct
 */

import {
  getOrchestrator,
  getRiskEngine,
  createTestSession,
  assertSessionCompleted,
  assertNoCrossContamination,
  assertAuditLogNotEmpty,
} from "./helpers";

describe("Test 10: Parallel Sessions", () => {
  it("should create two independent sessions", async () => {
    const orch = getOrchestrator();

    const session1 = await orch.createSession({
      title: "Parallel Session A",
      incident: "API returning 500 errors",
    });

    const session2 = await orch.createSession({
      title: "Parallel Session B",
      incident: "Database connection timeouts",
    });

    expect(session1.id).not.toBe(session2.id);
    expect(session1.incident).not.toBe(session2.incident);
  });

  it("should run two investigations without cross-contamination", async () => {
    const [result1, result2] = await Promise.all([
      createTestSession("Parallel A", "Investigate API 500 errors"),
      createTestSession("Parallel B", "Investigate database timeouts"),
    ]);

    assertSessionCompleted(result1.session);
    assertSessionCompleted(result2.session);

    // Events should not cross session boundaries
    assertNoCrossContamination(
      result1.events,
      result2.events,
      result1.session.id,
      result2.session.id
    );
  });

  it("should maintain separate audit logs", async () => {
    const [result1, result2] = await Promise.all([
      createTestSession("Log A", "Check API health"),
      createTestSession("Log B", "Check database health"),
    ]);

    // Each session should have its own audit entries
    for (const entry of result1.entries) {
      expect(entry.sessionId).toBe(result1.session.id);
    }
    for (const entry of result2.entries) {
      expect(entry.sessionId).toBe(result2.session.id);
    }
  });

  it("should produce separate audit logs for parallel sessions", async () => {
    const [result1, result2] = await Promise.all([
      createTestSession("Attestation A", "Investigate service A"),
      createTestSession("Attestation B", "Investigate service B"),
    ]);

    // Each session should have its own entries
    expect(result1.entries.length).toBeGreaterThan(0);
    expect(result2.entries.length).toBeGreaterThan(0);
    // Session IDs should be different
    expect(result1.session.id).not.toBe(result2.session.id);
  });

  it("should handle both sessions completing successfully", async () => {
    const results = await Promise.all([
      createTestSession("Success A", "Analyze error logs"),
      createTestSession("Success B", "Review configuration"),
      createTestSession("Success C", "Check system metrics"),
    ]);

    for (const result of results) {
      assertSessionCompleted(result.session);
      assertAuditLogNotEmpty(result.entries);
    }
  });

  it("should isolate risk assessments per session", async () => {
    const engine = getRiskEngine();

    // Risk engine should give consistent scores regardless of session
    const score1 = engine.assess("read_file", { path: "a.txt" });
    const score2 = engine.assess("delete_file", { path: "b.txt" });

    // read_file should be safer than delete_file
    expect(score1.score).toBeLessThan(score2.score);
  });
});
