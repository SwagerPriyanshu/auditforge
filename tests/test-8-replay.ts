/**
 * Test 8: Investigation Replay
 *
 * Input: Session ID from previous test
 * Expected: Full replay shows all actions with timestamps
 * Success: Replay matches original session
 */

import {
  getOrchestrator,
  createTestSession,
  assertSessionCompleted,
  assertAuditLogNotEmpty,
} from "./helpers";

describe("Test 8: Investigation Replay", () => {
  it("should replay a completed investigation", async () => {
    const result = await createTestSession(
      "Replay Test",
      "Investigate the 503 errors"
    );

    assertSessionCompleted(result.session);

    const orch = getOrchestrator();
    const replay = await orch.replayInvestigation(result.session.id);

    expect(replay).toBeDefined();
    expect(replay.entries).toBeDefined();
    expect(Array.isArray(replay.entries)).toBe(true);
  });

  it("should return all entries in chronological order", async () => {
    const result = await createTestSession(
      "Replay Order",
      "Check deployment status"
    );

    const orch = getOrchestrator();
    const replay = await orch.replayInvestigation(result.session.id);

    // Entries should be in timestamp order
    for (let i = 1; i < replay.entries.length; i++) {
      const prev = new Date(replay.entries[i - 1].timestamp).getTime();
      const curr = new Date(replay.entries[i].timestamp).getTime();
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });

  it("should verify chain integrity during replay", async () => {
    const result = await createTestSession(
      "Replay Integrity",
      "Investigate the incident"
    );

    const orch = getOrchestrator();
    const replay = await orch.replayInvestigation(result.session.id);

    // Chain should be valid
    expect(replay.verified).toBe(true);
  });

  it("should include merkle root in replay", async () => {
    const result = await createTestSession(
      "Replay Merkle",
      "Check system health"
    );

    const orch = getOrchestrator();
    const replay = await orch.replayInvestigation(result.session.id);

    expect(replay.merkleRoot).toBeTruthy();
  });

  it("should match entry count between original and replay", async () => {
    const result = await createTestSession(
      "Replay Count",
      "Investigate errors"
    );

    const orch = getOrchestrator();
    const replay = await orch.replayInvestigation(result.session.id);

    expect(replay.entries.length).toBe(result.entries.length);
  });
});
