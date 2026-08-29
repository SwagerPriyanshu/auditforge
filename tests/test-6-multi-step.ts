/**
 * Test 6: Multi-Step Investigation
 *
 * Input: "Clone repo, run tests, fix failing test, create PR"
 * Expected: All steps executed in sequence, each logged
 * Success: All steps completed, audit log complete
 */

import {
  createTestSession,
  assertSessionCompleted,
  assertEventsContainType,
  assertAuditLogNotEmpty,
  assertChainIntegrity,
} from "./helpers";

describe("Test 6: Multi-Step Investigation", () => {
  it("should complete a multi-step investigation", async () => {
    const result = await createTestSession(
      "Multi-Step Fix",
      "Clone the repo, run the test suite, identify and fix any failing tests, then create a PR with the fix"
    );

    assertSessionCompleted(result.session);
    assertAuditLogNotEmpty(result.entries);
  });

  it("should emit events for all phases", async () => {
    const result = await createTestSession(
      "Multi-Step Phases",
      "Clone repo, run tests, fix failing test, create PR"
    );

    const expectedTypes = [
      "plan_created",
      "evidence_collected",
      "hypothesis_formed",
      "conclusion_reached",
      "report_generated",
    ];

    for (const type of expectedTypes) {
      assertEventsContainType(result.events, type);
    }
  });

  it("should have multiple tool calls in audit log", async () => {
    const result = await createTestSession(
      "Multi-Step Tools",
      "Clone repo, run tests, fix failing test, create PR"
    );

    // Should have at least 3 tool calls (read, search, list)
    expect(result.entries.length).toBeGreaterThanOrEqual(3);
  });

  it("should maintain hash chain across multiple steps", async () => {
    const result = await createTestSession(
      "Multi-Step Chain",
      "Clone repo, run tests, fix failing test, create PR"
    );

    assertChainIntegrity(result.entries);
  });

  it("should have a conclusion with confidence score", async () => {
    const result = await createTestSession(
      "Multi-Step Conclusion",
      "Clone repo, run tests, fix failing test, create PR"
    );

    const conclusionEvent = result.events.find((e) => e.type === "conclusion_reached");
    expect(conclusionEvent).toBeDefined();

    if (conclusionEvent) {
      const data = conclusionEvent.data as Record<string, unknown>;
      console.log("CONCLUSION DATA:", JSON.stringify(data));
      expect(typeof data.confidence).toBe("number");
      expect(Number(data.confidence)).toBeGreaterThanOrEqual(0);
    }
  });
});
