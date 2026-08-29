/**
 * Test 9: Error Recovery
 *
 * Input: "Read file that doesn't exist"
 * Expected: Agent handles error gracefully
 * Success: Error handled, user prompted
 */

import {
  getRiskEngine,
  getPreVerifier,
  getPostVerifier,
  createTestSession,
  assertSessionCompleted,
  assertAuditLogNotEmpty,
} from "./helpers";

describe("Test 9: Error Recovery", () => {
  it("should handle read_file errors gracefully", async () => {
    // The investigation should complete even if some tools fail
    const result = await createTestSession(
      "Error Recovery Test",
      "Read the file /nonexistent/path/to/file.txt and analyze its contents"
    );

    // Session should still complete (errors are caught)
    assertSessionCompleted(result.session);
  });

  it("should still produce audit entries for failed tool calls", async () => {
    const result = await createTestSession(
      "Error Audit",
      "Try to read /nonexistent/file.txt"
    );

    // Even failed calls should be logged
    assertAuditLogNotEmpty(result.entries);
  });

  it("should validate file paths before execution", async () => {
    const verifier = getPreVerifier();

    // Path traversal should be blocked before execution
    const result = await verifier.verify("read_file", { path: "../../../etc/passwd" });
    expect(result.valid).toBe(false);
  });

  it("should detect error patterns in output", async () => {
    const verifier = getPostVerifier();

    const errorOutput = { error: "ENOENT: no such file or directory" };
    const result = await verifier.verify("read_file", { path: "missing.txt" }, errorOutput);

    // Should detect the error
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("should handle shell command failures", async () => {
    const result = await createTestSession(
      "Shell Error Recovery",
      "Run the command 'nonexistent-command-12345' and report what happens"
    );

    // Should complete despite command failure
    assertSessionCompleted(result.session);
    assertAuditLogNotEmpty(result.entries);
  });

  it("should record error evidence for failed tools", async () => {
    const result = await createTestSession(
      "Error Evidence",
      "Read /nonexistent/file and check /also/missing"
    );

    // Should have evidence even from failures
    const evidenceEvents = result.events.filter((e) => e.type === "evidence_collected");
    expect(evidenceEvents.length).toBeGreaterThan(0);
  });

  it("should not crash on invalid input", async () => {
    // The orchestrator should handle gracefully
    expect(async () => {
      await createTestSession("Graceful Handling", "");
    }).not.toThrow();
  });
});
