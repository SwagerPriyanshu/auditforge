/**
 * AuditForge — Risk Scoring Engine
 *
 * Scores every tool call on a 1-10 scale using weighted components:
 *
 *   finalRisk = baseRisk × 0.5 + inputRisk × 0.3 + contextRisk × 0.2
 *
 * Components:
 *   baseRisk   — Inherent risk of the tool itself (from registry)
 *   inputRisk  — Risk from what the tool is being asked to do
 *   contextRisk — Risk from session history and environment
 *
 * Risk levels:
 *   1-2:  safe      — Auto-approved
 *   3-4:  low       — Auto-approved, logged
 *   5-6:  medium    — Requires approval
 *   7-8:  high      — Requires approval + warning
 *   9-10: critical  — ALWAYS requires human approval
 */

// ─── Types ─────────────────────────────────────────────────────

export interface RiskScore {
  score: number;
  components: {
    baseRisk: number;
    inputRisk: number;
    contextRisk: number;
  };
  explanation: string;
  requiresApproval: boolean;
}

export interface RiskAssessment {
  score: number;
  level: "safe" | "low" | "medium" | "high" | "critical";
  reasons: string[];
  autoApprove: boolean;
  requiresApproval: boolean;
  isCritical: boolean;
}

// ─── Risk Engine ───────────────────────────────────────────────

export class RiskEngine {
  private toolRiskScores = new Map<string, number>([
    // Filesystem
    ["read_file", 2],
    ["write_file", 6],
    ["delete_file", 9],
    ["list_directory", 1],
    ["file_exists", 1],
    ["get_file_info", 1],

    // GitHub
    ["get_repository", 1],
    ["list_prs", 1],
    ["get_pr_details", 1],
    ["create_pr", 5],
    ["merge_pr", 8],
    ["close_pr", 7],
    ["comment_on_pr", 3],
    ["get_file_contents", 1],
    ["create_issue", 4],

    // Shell
    ["exec", 7],
    ["exec_safe", 5],

    // API
    ["api_get", 3],
    ["api_post", 6],
    ["api_delete", 8],

    // Communication
    ["send_email", 8],
    ["send_notification", 4],

    // Investigation tools (simulated in demo mode)
    ["search_files", 2],
    ["list_commits", 1],
    ["execute_code", 6],
    ["run_command", 5],
  ]);

  private sessionHistory = new Map<string, Array<{ toolName: string; success: boolean; riskScore: number }>>();

  /**
   * Score a tool call using weighted risk components.
   */
  async score(toolName: string, input: Record<string, unknown>, sessionId?: string): Promise<RiskScore> {
    // 1. Base risk from tool registry
    const baseRisk = this.toolRiskScores.get(toolName) ?? 5;

    // 2. Input-specific risk
    const inputRisk = this.assessInputRisk(toolName, input);

    // 3. Context risk from session history
    const contextRisk = sessionId ? await this.assessContextRisk(sessionId, toolName) : 5;

    // 4. Weighted combination
    const finalRisk = Math.min(10, Math.max(1,
      baseRisk * 0.5 + inputRisk * 0.3 + contextRisk * 0.2
    ));

    const rounded = Math.round(finalRisk);

    return {
      score: rounded,
      components: { baseRisk, inputRisk, contextRisk },
      explanation: this.generateExplanation(toolName, input, rounded, baseRisk, inputRisk, contextRisk),
      // Require explicit approval for anything above "low" (score > 4)
      requiresApproval: rounded > 4,
    };
  }

  /**
   * Get the risk score for a tool (convenience method).
   */
  assess(toolName: string, input: Record<string, unknown>): RiskAssessment {
    const baseRisk = this.toolRiskScores.get(toolName) ?? 5;
    const inputRisk = this.assessInputRisk(toolName, input);
    const score = Math.min(10, Math.max(1, Math.round(baseRisk * 0.5 + inputRisk * 0.5)));
    const level = this.scoreToLevel(score);

    return {
      score,
      level,
      reasons: [
        `Base risk for ${toolName}: ${baseRisk}/10`,
        `Input risk: ${inputRisk}/10`,
      ],
      autoApprove: score <= 2,
      requiresApproval: score > 4, // aligned with score() — medium (5+) requires approval
      isCritical: score >= 8,
    };
  }

  /**
   * Check if a tool is known to the risk engine.
   */
  isKnownTool(toolName: string): boolean {
    return this.toolRiskScores.has(toolName);
  }

  /**
   * Check if a tool is allowed by policy.
   */
  isToolAllowed(toolName: string): boolean {
    // All registered tools are allowed by default.
    // In production, this would check against a policy file.
    return this.toolRiskScores.has(toolName);
  }

  /**
   * Record a tool call in session history for context risk assessment.
   */
  recordCall(sessionId: string, toolName: string, success: boolean, riskScore: number): void {
    if (!this.sessionHistory.has(sessionId)) {
      this.sessionHistory.set(sessionId, []);
    }
    this.sessionHistory.get(sessionId)!.push({ toolName, success, riskScore });
  }

  // ─── Input Risk Assessment ────────────────────────────────

  private assessInputRisk(toolName: string, input: Record<string, unknown>): number {
    switch (toolName) {
      case "read_file":
      case "write_file":
      case "delete_file":
        return this.assessFilesystemRisk(input);
      case "exec":
      case "exec_safe":
      case "run_command":
        return this.assessShellRisk(input);
      case "create_pr":
      case "merge_pr":
      case "close_pr":
        return this.assessGitHubRisk(input);
      case "api_get":
      case "api_post":
      case "api_delete":
        return this.assessApiRisk(input);
      case "search_files":
      case "list_commits":
      case "list_directory":
        return 2; // Read-only investigation tools are low risk
      case "execute_code":
        return 7; // Code execution is high risk
      default:
        return 5;
    }
  }

  private assessFilesystemRisk(input: Record<string, unknown>): number {
    const path = String(input.path ?? "");
    let risk = 3;

    // Sensitive directories increase risk
    if (path.includes(".env") || path.includes("secrets") || path.includes(".secret")) risk += 3;
    if (path.includes("config") || path.includes("etc")) risk += 2;
    if (path.includes("package.json") || path.includes("tsconfig")) risk += 2;
    if (path.startsWith("/tmp") || path.startsWith("/var/tmp")) risk -= 1;
    if (path.includes(".bak") || path.includes(".backup")) risk -= 1;

    // Path traversal and null-byte injection attempts
    if (path.includes("..") || path.includes("~")) risk += 2;
    if (path.includes("\0") || path.includes("%00")) risk += 4;

    return Math.min(10, Math.max(1, risk));
  }

  private assessShellRisk(input: Record<string, unknown>): number {
    const command = String(input.command ?? "");
    let risk = 5;

    // Dangerous patterns
    if (/\brm\s+-rf\b/.test(command)) risk += 4;
    if (/\bkill\b|\bpkill\b/.test(command)) risk += 3;
    if (/\bsudo\b/.test(command)) risk += 3;
    if (/\bchmod\b|\bchown\b/.test(command)) risk += 2;
    if (/\bDROP\b|\bDELETE\b|\bTRUNCATE\b/i.test(command)) risk += 4;
    if (/\bcurl\b.*\|\s*(ba)?sh\b/.test(command)) risk += 5;
    if (/\bwget\b.*\|\s*(ba)?sh\b/.test(command)) risk += 5;

    // Pipe injection and command chaining
    if (/;\s*rm|&&\s*rm|\|\s*rm/.test(command)) risk += 4;
    if (/`[^`]+`|\$\([^)]+\)/.test(command)) risk += 2; // command substitution

    // Safe patterns reduce risk
    if (/\b(ls|cat|head|tail|grep|find|echo|pwd|whoami|date|uptime)\b/.test(command)) risk -= 2;
    if (/\bgit\s+(log|status|diff|show)\b/.test(command)) risk -= 1;

    return Math.min(10, Math.max(1, risk));
  }

  private assessGitHubRisk(input: Record<string, unknown>): number {
    const base = 4;
    let risk = base;

    const branch = String(input.base ?? input.branch ?? "");
    if (branch === "main" || branch === "master") risk += 2;

    const title = String(input.title ?? "");
    if (/hotfix|emergency|urgent/i.test(title)) risk += 1;

    return Math.min(10, Math.max(1, risk));
  }

  private assessApiRisk(input: Record<string, unknown>): number {
    const url = String(input.url ?? "");
    let risk = 3;

    // Sensitive endpoints
    if (/\/admin|\/delete|\/remove|\/destroy/i.test(url)) risk += 4;
    if (/\/auth|\/login|\/token/i.test(url)) risk += 2;
    if (/\/payment|\/billing|\/charge/i.test(url)) risk += 3;

    // External vs internal
    if (!url.includes("localhost") && !url.includes("127.0.0.1")) risk += 1;

    return Math.min(10, Math.max(1, risk));
  }

  // ─── Context Risk Assessment ──────────────────────────────

  private async assessContextRisk(sessionId: string, toolName: string): Promise<number> {
    const history = this.sessionHistory.get(sessionId) ?? [];
    let risk = 5;

    if (history.length === 0) return risk;

    // Recent failures increase risk
    const recentFailures = history.slice(-5).filter((h) => !h.success).length;
    risk += recentFailures;

    // High-risk calls in succession increase risk
    const recentHighRisk = history.slice(-3).filter((h) => h.riskScore >= 7).length;
    if (recentHighRisk >= 2) risk += 2;

    // Same tool called repeatedly might indicate a loop
    const lastThree = history.slice(-3).map((h) => h.toolName);
    if (lastThree.every((t) => t === toolName)) risk += 1;

    return Math.min(10, Math.max(1, risk));
  }

  // ─── Helpers ──────────────────────────────────────────────

  private scoreToLevel(score: number): RiskAssessment["level"] {
    if (score <= 2) return "safe";
    if (score <= 4) return "low";
    if (score <= 6) return "medium";
    if (score <= 8) return "high";
    return "critical";
  }

  private generateExplanation(
    toolName: string,
    input: Record<string, unknown>,
    finalRisk: number,
    baseRisk: number,
    inputRisk: number,
    contextRisk: number
  ): string {
    const level = this.scoreToLevel(finalRisk);
    const parts: string[] = [];

    parts.push(`${toolName} scored ${finalRisk}/10 (${level})`);

    if (baseRisk >= 7) parts.push(`Tool is inherently high-risk`);
    if (inputRisk >= 7) parts.push(`Input increases risk significantly`);
    if (contextRisk >= 7) parts.push(`Session context suggests elevated risk`);

    if (finalRisk <= 2) parts.push("Safe to auto-approve");
    else if (finalRisk <= 4) parts.push("Low risk, auto-approved with logging");
    else if (finalRisk <= 6) parts.push("Moderate risk, requires approval");
    else if (finalRisk <= 8) parts.push("High risk, requires explicit approval");
    else parts.push("CRITICAL — requires human approval before execution");

    return parts.join(". ");
  }
}
