import { approvalGate, respondToApproval } from "../src/approval/gate";
import { InvestigationOrchestrator } from "../src/agent/orchestrator";
import { getDb } from "../src/storage/audit.db";

describe("Test 11: Demo Readiness", () => {
  beforeAll(async () => {
    await getDb();
  });

  it("should recommend a config write action for config-drift incidents", async () => {
    const orchestrator = new InvestigationOrchestrator();
    const session = await orchestrator.createSession({
      title: "Config Drift",
      incident: "The config file seems wrong, investigate and fix the Redis pool settings",
    });

    const result = await orchestrator.startInvestigation(session.id, {
      onEvent: () => {},
      onApprovalNeeded: () => {},
    });

    expect(result.report.conclusion.recommendedAction?.toolName).toBe("write_file");
    expect(result.report.actionsTaken[0]?.toolName).toBe("write_file");
  });

  it("should recommend a PR action for CI failure incidents", async () => {
    const orchestrator = new InvestigationOrchestrator();
    const session = await orchestrator.createSession({
      title: "CI Failure",
      incident: "Pull request #42 is flaky in CI, investigate the failing test and prepare a fix PR",
    });

    const result = await orchestrator.startInvestigation(session.id, {
      onEvent: () => {},
      onApprovalNeeded: () => {},
    });

    expect(result.report.conclusion.recommendedAction?.toolName).toBe("create_pr");
  });

  it("should pause for human approval in live mode and resume after approval", async () => {
    const orchestrator = new InvestigationOrchestrator();
    const session = await orchestrator.createSession({
      title: "Dangerous Cleanup",
      incident: "Disk volume is full, purge old logs and clean up safely",
    });

    let approvalId: string | null = null;

    const investigationPromise = orchestrator.startInvestigation(
      session.id,
      {
        onEvent: () => {},
        onApprovalNeeded: (id) => {
          approvalId = id;
        },
      },
      { approvalMode: "human" }
    );

    await waitFor(() => approvalId !== null, 2000);
    expect(approvalId).not.toBeNull();
    expect(approvalGate.getPendingApprovals(session.id)).toHaveLength(1);

    await respondToApproval(session.id, approvalId!, "approve", undefined, "judge", "Approved in demo");
    const result = await investigationPromise;

    expect(result.status).toBe("completed");
    expect(result.report.actionsTaken[0]?.toolName).toBe("delete_file");
    expect(approvalGate.getPendingApprovals(session.id)).toHaveLength(0);
  });
});

async function waitFor(check: () => boolean, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timed out after ${timeoutMs}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}
