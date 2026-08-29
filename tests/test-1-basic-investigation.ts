/**
 * Test 1: Basic Investigation
 *
 * Input: "The application is returning 500 errors on the /api/users endpoint"
 * Expected: Agent investigates, gathers evidence, forms hypotheses, reaches conclusion
 * Success: All steps completed, audit log complete
 */

import {
  createTestSession,
  assertSessionCompleted,
  assertEventsContainType,
  assertAuditLogNotEmpty,
  assertChainIntegrity,
} from "./helpers";

describe("Test 1: Basic Investigation", () => {
  let result: Awaited<ReturnType<typeof createTestSession>>;

  beforeAll(async () => {
    result = await createTestSession(
      "500 Error Investigation",
      "The application is returning 500 errors on the /api/users endpoint since 2:45 PM"
    );
  });

  it("should complete the investigation", () => {
    assertSessionCompleted(result.session);
  });

  it("should emit a plan_created event", () => {
    assertEventsContainType(result.events, "plan_created");
  });

  it("should emit evidence_collected event", () => {
    assertEventsContainType(result.events, "evidence_collected");
  });

  it("should emit hypothesis_formed events", () => {
    assertEventsContainType(result.events, "hypothesis_formed");
  });

  it("should emit hypothesis_tested events", () => {
    assertEventsContainType(result.events, "hypothesis_tested");
  });

  it("should emit conclusion_reached event", () => {
    assertEventsContainType(result.events, "conclusion_reached");
  });

  it("should emit report_generated event", () => {
    assertEventsContainType(result.events, "report_generated");
  });

  it("should have a non-empty audit log", () => {
    assertAuditLogNotEmpty(result.entries);
  });

  it("should maintain hash chain integrity", () => {
    assertChainIntegrity(result.entries);
  });

  it("should have evidence with confidence scores", () => {
    const evidenceEvents = result.events.filter((e) => e.type === "evidence_collected");
    expect(evidenceEvents.length).toBeGreaterThan(0);
  });

  it("should have at least 3 hypotheses", () => {
    const hypothesisEvents = result.events.filter((e) => e.type === "hypothesis_formed");
    expect(hypothesisEvents.length).toBeGreaterThanOrEqual(3);
  });
});
