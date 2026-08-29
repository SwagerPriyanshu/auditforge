/**
 * Test 3: GitHub PR Investigation
 *
 * Input: "PR #42 is failing tests, investigate why"
 * Expected: Agent reads PR, checks tests, identifies issue, proposes fix
 * Success: PR analyzed, issue identified, fix proposed
 */

import {
  getRiskEngine,
  getPreVerifier,
  createTestSession,
  assertSessionCompleted,
  assertEventsContainType,
  assertAuditLogNotEmpty,
} from "./helpers";

describe("Test 3: GitHub PR Investigation", () => {
  it("should score create_pr as moderate risk (5)", () => {
    const engine = getRiskEngine();
    const assessment = engine.assess("create_pr", {
      repo: "org/repo",
      title: "Fix: test failures",
      head: "fix/tests",
      base: "main",
    });
    expect(assessment.score).toBeGreaterThanOrEqual(4);
    expect(assessment.score).toBeLessThanOrEqual(6);
  });

  it("should score merge_pr as high risk (>= 6)", () => {
    const engine = getRiskEngine();
    const assessment = engine.assess("merge_pr", { repo: "org/repo", prNumber: 42 });
    expect(assessment.score).toBeGreaterThanOrEqual(6);
  });

  it("should validate GitHub PR creation input", async () => {
    const verifier = getPreVerifier();

    // Valid PR creation
    const valid = await verifier.verify("create_pr", { repo: "org/repo", title: "Fix", head: "fix", base: "main" });
    expect(valid.valid).toBe(true);

    // Invalid: missing required fields
    const invalid = await verifier.verify("create_pr", { repo: "org/repo" });
    expect(invalid.valid).toBe(false);
  });

  it("should validate PR creation requires all fields", async () => {
    const verifier = getPreVerifier();

    const incomplete = await verifier.verify("create_pr", {
      repo: "org/repo",
      title: "Fix tests",
      // Missing head and base
    });
    expect(incomplete.valid).toBe(false);
    expect(incomplete.reason).toContain("title, head, and base");
  });

  it("should increase risk when targeting main branch", () => {
    const engine = getRiskEngine();

    const mainBranch = engine.assess("merge_pr", { repo: "org/repo", base: "main" });
    const featureBranch = engine.assess("merge_pr", { repo: "org/repo", base: "feature/foo" });

    // Main branch should have higher or equal risk
    expect(mainBranch.score).toBeGreaterThanOrEqual(featureBranch.score);
  });

  it("should complete a PR investigation session", async () => {
    const result = await createTestSession(
      "PR Investigation",
      "PR #42 is failing tests, investigate why the CI pipeline is red"
    );

    assertSessionCompleted(result.session);
    assertAuditLogNotEmpty(result.entries);
    assertEventsContainType(result.events, "conclusion_reached");
  });
});
