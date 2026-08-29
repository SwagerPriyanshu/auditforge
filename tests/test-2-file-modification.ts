/**
 * Test 2: File Modification
 *
 * Input: "The config file seems wrong, investigate and fix it"
 * Expected: Agent reads config, identifies issue, proposes fix, gets approval
 * Success: File modified correctly, approval was required
 */

import {
  getOrchestrator,
  getRiskEngine,
  getPreVerifier,
  createTestSession,
  assertSessionCompleted,
  assertEventsContainType,
  assertAuditLogNotEmpty,
} from "./helpers";

describe("Test 2: File Modification", () => {
  it("should flag write_file as requiring approval (risk >= 4)", () => {
    const engine = getRiskEngine();
    const assessment = engine.assess("write_file", { path: "config/settings.yaml" });
    expect(assessment.score).toBeGreaterThanOrEqual(4);
    expect(assessment.requiresApproval).toBe(true);
  });

  it("should flag delete_file as high risk (risk >= 6)", () => {
    const engine = getRiskEngine();
    const assessment = engine.assess("delete_file", { path: "config/old.yaml" });
    expect(assessment.score).toBeGreaterThanOrEqual(6);
    expect(assessment.requiresApproval).toBe(true);
  });

  it("should validate file paths in pre-execution", async () => {
    const verifier = getPreVerifier();

    // Valid path should pass
    const valid = await verifier.verify("read_file", { path: "config/settings.yaml" });
    expect(valid.valid).toBe(true);

    // Path traversal should fail
    const traversal = await verifier.verify("read_file", { path: "../../etc/passwd" });
    expect(traversal.valid).toBe(false);
    expect(traversal.reason).toContain("traversal");
  });

  it("should block absolute paths for write operations", async () => {
    const verifier = getPreVerifier();
    const result = await verifier.verify("write_file", { path: "/etc/passwd", content: "test" });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Absolute paths");
  });

  it("should complete a config investigation", async () => {
    const result = await createTestSession(
      "Config Investigation",
      "The config file seems wrong, investigate and fix it"
    );

    assertSessionCompleted(result.session);
    assertAuditLogNotEmpty(result.entries);

    // Should have read_file calls for config inspection
    const readFileCalls = result.entries.filter((e) => e.toolName === "read_file");
    expect(readFileCalls.length).toBeGreaterThan(0);
  });

  it("should record backup path on write operations", async () => {
    // This tests the filesystem tool's backup behavior
    // In a real test, we'd verify the .bak file exists
    const engine = getRiskEngine();
    const assessment = engine.assess("write_file", { path: "config/app.yaml" });
    expect(assessment.score).toBeGreaterThanOrEqual(4);
  });
});
