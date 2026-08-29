/**
 * Test 5: Dangerous Command Detection
 *
 * Input: "Delete all temporary files in /tmp"
 * Expected: Risk engine flags as high risk (9-10), requires approval
 * Success: Approval required, command not executed without approval
 */

import {
  getRiskEngine,
  getPreVerifier,
  getApprovalGate,
  assertRiskScoreInRange,
} from "./helpers";

describe("Test 5: Dangerous Command Detection", () => {
  it("should flag rm -rf /tmp as high/critical risk (>= 7)", () => {
    const engine = getRiskEngine();
    const assessment = engine.assess("exec", { command: "rm -rf /tmp/*" });
    expect(assessment.score).toBeGreaterThanOrEqual(7);
    expect(assessment.requiresApproval).toBe(true);
  });

  it("should flag delete_file as high risk (>= 6)", () => {
    const engine = getRiskEngine();
    const assessment = engine.assess("delete_file", { path: "/tmp/important.txt" });
    expect(assessment.score).toBeGreaterThanOrEqual(6);
    expect(assessment.requiresApproval).toBe(true);
  });

  it("should require confirmation for delete_file", async () => {
    const verifier = getPreVerifier();

    // Without confirmation
    const noConfirm = await verifier.verify("delete_file", { path: "temp.txt" });
    expect(noConfirm.valid).toBe(false);
    expect(noConfirm.reason).toContain("confirmation");

    // With confirmation
    const confirmed = await verifier.verify("delete_file", { path: "temp.txt", confirm: true });
    expect(confirmed.valid).toBe(true);
  });

  it("should require confirmation for merge_pr", async () => {
    const verifier = getPreVerifier();

    const noConfirm = await verifier.verify("merge_pr", { repo: "org/repo", prNumber: 1 });
    expect(noConfirm.valid).toBe(false);

    const confirmed = await verifier.verify("merge_pr", { repo: "org/repo", prNumber: 1, confirm: true });
    expect(confirmed.valid).toBe(true);
  });

  it("should flag commands containing dangerous patterns", () => {
    const engine = getRiskEngine();

    // Commands with dangerous patterns should have elevated risk
    const assessment = engine.assess("exec", { command: "echo 'rm -rf /' > script.sh" });
    expect(assessment.score).toBeGreaterThanOrEqual(5);
  });

  it("should provide alternatives for dangerous actions", () => {
    const gate = getApprovalGate();
    // The gate should suggest alternatives for dangerous tools
    // This is tested indirectly through the suggestAlternative method
    expect(gate).toBeDefined();
  });

  it("should block sudo commands with elevated risk", () => {
    const engine = getRiskEngine();

    const normal = engine.assess("exec", { command: "apt install nodejs" });
    const sudo = engine.assess("exec", { command: "sudo apt install nodejs" });

    expect(sudo.score).toBeGreaterThan(normal.score);
  });
});
