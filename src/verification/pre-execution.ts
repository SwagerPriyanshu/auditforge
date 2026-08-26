/**
 * AuditForge — Pre-Execution Verifier
 *
 * Runs BEFORE a tool call is executed. Validates:
 *   1. Is the tool allowed by policy?
 *   2. Are the inputs valid and safe?
 *   3. Does it violate any policy rules?
 *
 * This is the first line of defense against dangerous actions.
 */

import { RiskEngine } from "../risk/engine";

// ─── Types ─────────────────────────────────────────────────────

export interface VerificationResult {
  valid: boolean;
  reason?: string;
  checks?: CheckResult[];
}

export interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
}

interface ValidationResult {
  valid: boolean;
  reason?: string;
}

// ─── Pre-Execution Verifier ────────────────────────────────────

export class PreExecutionVerifier {
  private riskEngine: RiskEngine;

  constructor(riskEngine?: RiskEngine) {
    this.riskEngine = riskEngine ?? new RiskEngine();
  }

  /**
   * Verify a tool call before execution.
   *
   * Returns { valid: true } if the call can proceed,
   * or { valid: false, reason: "..." } if blocked.
   */
  async verify(
    toolName: string,
    input: Record<string, unknown>,
    sessionId?: string
  ): Promise<VerificationResult> {
    const checks: CheckResult[] = [];

    // Check 1: Is the tool allowed?
    const toolAllowed = this.checkToolAllowed(toolName);
    checks.push(toolAllowed);
    if (!toolAllowed.passed) {
      return { valid: false, reason: toolAllowed.message, checks };
    }

    // Check 2: Are the inputs valid?
    const inputValid = this.validateInput(toolName, input);
    checks.push(inputValid);
    if (!inputValid.passed) {
      return { valid: false, reason: inputValid.message, checks };
    }

    // Check 3: Safety pattern check
    const safetyCheck = this.checkSafetyPatterns(toolName, input);
    checks.push(safetyCheck);
    if (!safetyCheck.passed) {
      return { valid: false, reason: safetyCheck.message, checks };
    }

    // Check 4: Policy rules
    const policyCheck = await this.checkPolicyRules(toolName, input, sessionId);
    checks.push(policyCheck);
    if (!policyCheck.passed) {
      return { valid: false, reason: policyCheck.message, checks };
    }

    return { valid: true, checks };
  }

  // ─── Individual Checks ──────────────────────────────────

  private checkToolAllowed(toolName: string): CheckResult {
    if (this.riskEngine.isToolAllowed(toolName)) {
      return {
        name: "tool_allowed",
        passed: true,
        message: `Tool "${toolName}" is registered and allowed`,
      };
    }

    return {
      name: "tool_allowed",
      passed: false,
      message: `Tool "${toolName}" is not registered. Only known tools can be executed.`,
    };
  }

  private validateInput(toolName: string, input: Record<string, unknown>): CheckResult {
    // Tool-specific input validation
    if (toolName === "read_file" || toolName === "write_file" || toolName === "delete_file") {
      return this.validateFilesystemInput(toolName, input);
    }
    if (toolName === "exec" || toolName === "exec_safe") {
      return this.validateShellInput(input);
    }
    if (toolName === "api_get" || toolName === "api_post" || toolName === "api_delete") {
      return this.validateApiInput(input);
    }
    if (toolName === "create_pr" || toolName === "merge_pr") {
      return this.validateGitHubInput(toolName, input);
    }

    return { name: "input_validation", passed: true, message: "No specific validation for this tool" };
  }

  private validateFilesystemInput(toolName: string, input: Record<string, unknown>): CheckResult {
    const path = String(input.path ?? "");

    if (!path) {
      return { name: "input_validation", passed: false, message: "File path is required" };
    }

    // Path traversal check
    if (path.includes("..")) {
      return { name: "input_validation", passed: false, message: "Path traversal (..) is not allowed" };
    }

    // Absolute path check for write operations
    if ((toolName === "write_file" || toolName === "delete_file") && path.startsWith("/")) {
      return {
        name: "input_validation",
        passed: false,
        message: "Absolute paths are not allowed for write/delete operations",
      };
    }

    // Home directory check
    if (path.startsWith("~")) {
      return { name: "input_validation", passed: false, message: "Home directory paths are not allowed" };
    }

    return { name: "input_validation", passed: true, message: "Filesystem input is valid" };
  }

  private validateShellInput(input: Record<string, unknown>): CheckResult {
    const command = String(input.command ?? "");

    if (!command) {
      return { name: "input_validation", passed: false, message: "Command is required" };
    }

    if (command.length > 4096) {
      return { name: "input_validation", passed: false, message: "Command exceeds maximum length (4096 chars)" };
    }

    // Null byte injection check
    if (command.includes("\0")) {
      return { name: "input_validation", passed: false, message: "Null bytes in command are not allowed" };
    }

    return { name: "input_validation", passed: true, message: "Shell input is valid" };
  }

  private validateApiInput(input: Record<string, unknown>): CheckResult {
    const url = String(input.url ?? "");

    if (!url) {
      return { name: "input_validation", passed: false, message: "URL is required" };
    }

    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return { name: "input_validation", passed: false, message: "Only HTTP/HTTPS URLs are allowed" };
      }
    } catch {
      return { name: "input_validation", passed: false, message: `Invalid URL: ${url}` };
    }

    return { name: "input_validation", passed: true, message: "API input is valid" };
  }

  private validateGitHubInput(toolName: string, input: Record<string, unknown>): CheckResult {
    const repo = String(input.repo ?? "");
    if (!repo || !repo.includes("/")) {
      return { name: "input_validation", passed: false, message: "Repository must be in owner/repo format" };
    }

    if (toolName === "create_pr") {
      const title = String(input.title ?? "");
      const head = String(input.head ?? "");
      const base = String(input.base ?? "");
      if (!title || !head || !base) {
        return { name: "input_validation", passed: false, message: "PR requires title, head, and base" };
      }
    }

    return { name: "input_validation", passed: true, message: "GitHub input is valid" };
  }

  private checkSafetyPatterns(toolName: string, input: Record<string, unknown>): CheckResult {
    const inputStr = JSON.stringify(input).toLowerCase();

    // Universal blocked patterns
    const blockedPatterns = [
      { pattern: /\brm\s+-rf\s+\/\b/, message: "Recursive deletion of root filesystem" },
      { pattern: /\bmkfs\b/, message: "Filesystem format command" },
      { pattern: /\bdd\s+if=.*of=\/dev\//, message: "Direct device write" },
      { pattern: /\bcurl\b.*\|\s*(ba)?sh\b/, message: "Remote code execution via pipe" },
      { pattern: /\bwget\b.*\|\s*(ba)?sh\b/, message: "Remote code execution via pipe" },
    ];

    for (const { pattern, message } of blockedPatterns) {
      if (pattern.test(inputStr)) {
        return { name: "safety_patterns", passed: false, message };
      }
    }

    // Tool-specific safety checks
    if (toolName === "exec" || toolName === "exec_safe") {
      const command = String(input.command ?? "");
      if (/\bchmod\s+777\b/.test(command)) {
        return { name: "safety_patterns", passed: false, message: "chmod 777 is not allowed" };
      }
    }

    return { name: "safety_patterns", passed: true, message: "No dangerous patterns detected" };
  }

  private async checkPolicyRules(
    toolName: string,
    input: Record<string, unknown>,
    _sessionId?: string
  ): Promise<CheckResult> {
    // In production, this loads from config/policies.yaml
    // For now, enforce basic rules

    // Rule: delete_file always requires explicit confirmation
    if (toolName === "delete_file") {
      const confirm = input.confirm;
      if (confirm !== true && confirm !== "yes") {
        return {
          name: "policy_rules",
          passed: false,
          message: 'delete_file requires explicit confirmation: set input.confirm = true or "yes"',
        };
      }
    }

    // Rule: merge_pr requires explicit confirmation
    if (toolName === "merge_pr") {
      const confirm = input.confirm;
      if (confirm !== true && confirm !== "yes") {
        return {
          name: "policy_rules",
          passed: false,
          message: 'merge_pr requires explicit confirmation: set input.confirm = true or "yes"',
        };
      }
    }

    return { name: "policy_rules", passed: true, message: "Policy rules satisfied" };
  }
}
