/**
 * AuditForge — Post-Execution Verifier
 *
 * Runs AFTER a tool call completes. Validates:
 *   1. Did the tool succeed?
 *   2. Does the output match expectations?
 *   3. Is there sensitive data in the output?
 *   4. Are there any error patterns?
 *
 * Catches issues that pre-execution checks can't predict.
 */

// ─── Types ─────────────────────────────────────────────────────

export interface PostVerificationResult {
  verified: boolean;
  issues: string[];
  warnings: string[];
}

interface ExpectationResult {
  matched: boolean;
  reason: string;
}

interface SensitiveResult {
  found: boolean;
  type: string;
  count: number;
}

// ─── Post-Execution Verifier ───────────────────────────────────

export class PostExecutionVerifier {
  /**
   * Verify a tool call's output after execution.
   *
   * Returns { verified: true } if no issues found,
   * or { verified: false, issues: [...] } with specific problems.
   */
  async verify(
    toolName: string,
    input: Record<string, unknown>,
    output: unknown
  ): Promise<PostVerificationResult> {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check 1: Did the tool succeed?
    const successCheck = this.checkSuccess(toolName, output);
    if (!successCheck.passed) {
      issues.push(successCheck.message);
    }

    // Check 2: Output format validation
    const formatCheck = this.checkOutputFormat(toolName, output);
    if (!formatCheck.passed) {
      warnings.push(formatCheck.message);
    }

    // Check 3: Expectation matching
    const expectationResult = this.checkExpectations(toolName, input, output);
    if (!expectationResult.matched) {
      warnings.push(expectationResult.reason);
    }

    // Check 4: Sensitive data detection
    const sensitiveResult = this.checkSensitiveData(output);
    if (sensitiveResult.found) {
      issues.push(`Sensitive data detected: ${sensitiveResult.type} (${sensitiveResult.count} occurrences)`);
    }

    // Check 5: Error pattern detection
    const errorPatterns = this.checkErrorPatterns(output);
    if (errorPatterns.length > 0) {
      warnings.push(...errorPatterns);
    }

    // Check 6: Output size check
    const sizeCheck = this.checkOutputSize(output);
    if (sizeCheck.truncated) {
      warnings.push(sizeCheck.message);
    }

    return {
      verified: issues.length === 0,
      issues,
      warnings,
    };
  }

  // ─── Individual Checks ──────────────────────────────────

  private checkSuccess(toolName: string, output: unknown): { passed: boolean; message: string } {
    if (output === null || output === undefined) {
      // Some tools legitimately return null (write operations)
      if (toolName === "write_file" || toolName === "delete_file") {
        return { passed: true, message: "Tool returned null (expected for write operations)" };
      }
      return { passed: true, message: "Tool returned null output" };
    }

    if (typeof output === "object" && "error" in (output as Record<string, unknown>)) {
      const error = (output as Record<string, unknown>).error;
      return {
        passed: false,
        message: `Tool returned error: ${error}`,
      };
    }

    return { passed: true, message: "Tool executed successfully" };
  }

  private checkOutputFormat(toolName: string, output: unknown): { passed: boolean; message: string } {
    if (output === null || output === undefined) {
      return { passed: true, message: "Null output" };
    }

    // Read tools should return content
    if (toolName === "read_file" && typeof output === "object" && output !== null) {
      const obj = output as Record<string, unknown>;
      if (!("content" in obj) && !("error" in obj)) {
        return { passed: false, message: "read_file output missing 'content' field" };
      }
    }

    // Shell tools should return stdout/stderr
    if ((toolName === "exec" || toolName === "exec_safe") && typeof output === "object" && output !== null) {
      const obj = output as Record<string, unknown>;
      if (!("stdout" in obj) && !("exitCode" in obj)) {
        return { passed: false, message: "Shell output missing 'stdout' or 'exitCode' field" };
      }
    }

    // API tools should return status
    if (toolName.startsWith("api_") && typeof output === "object" && output !== null) {
      const obj = output as Record<string, unknown>;
      if (!("status" in obj) && !("body" in obj)) {
        return { passed: false, message: "API output missing 'status' or 'body' field" };
      }
    }

    return { passed: true, message: "Output format is valid" };
  }

  private checkExpectations(
    toolName: string,
    input: Record<string, unknown>,
    output: unknown
  ): ExpectationResult {
    if (output === null || typeof output !== "object") {
      return { matched: true, reason: "" };
    }

    const obj = output as Record<string, unknown>;

    // File read should contain the path
    if (toolName === "read_file" && "path" in obj) {
      if (obj.path !== input.path) {
        return {
          matched: false,
          reason: `Read path mismatch: expected ${input.path}, got ${obj.path}`,
        };
      }
    }

    // Directory listing should have entries
    if (toolName === "list_directory" && "entries" in obj) {
      if (!Array.isArray(obj.entries)) {
        return {
          matched: false,
          reason: "list_directory output 'entries' is not an array",
        };
      }
    }

    // Shell should have exitCode
    if ((toolName === "exec" || toolName === "exec_safe") && "exitCode" in obj) {
      if (typeof obj.exitCode !== "number") {
        return {
          matched: false,
          reason: `exitCode should be a number, got ${typeof obj.exitCode}`,
        };
      }
    }

    return { matched: true, reason: "" };
  }

  private checkSensitiveData(output: unknown): SensitiveResult {
    const outputStr = JSON.stringify(output);

    const patterns = [
      { name: "API Key", pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*["']?([A-Za-z0-9_-]{20,})/gi },
      { name: "Bearer Token", pattern: /Bearer\s+[A-Za-z0-9._-]{20,}/g },
      { name: "Password", pattern: /(?:password|passwd|pwd)\s*[:=]\s*["']?([^\s"']{8,})/gi },
      { name: "Private Key", pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g },
      { name: "AWS Access Key", pattern: /AKIA[0-9A-Z]{16}/g },
      { name: "GitHub Token", pattern: /ghp_[A-Za-z0-9]{36}/g },
    ];

    for (const { name, pattern } of patterns) {
      const matches = outputStr.match(pattern);
      if (matches && matches.length > 0) {
        return { found: true, type: name, count: matches.length };
      }
    }

    return { found: false, type: "", count: 0 };
  }

  private checkErrorPatterns(output: unknown): string[] {
    const outputStr = JSON.stringify(output);
    const warnings: string[] = [];

    const patterns = [
      { pattern: /permission\s+denied/i, message: "Permission denied in output" },
      { pattern: /access\s+denied/i, message: "Access denied in output" },
      { pattern: /rate\s*limit/i, message: "Rate limiting detected" },
      { pattern: /not\s+found/i, message: "Resource not found" },
      { pattern: /timeout/i, message: "Timeout detected" },
      { pattern: /out\s+of\s+memory/i, message: "Out of memory condition" },
      { pattern: /segmentation\s+fault/i, message: "Segmentation fault" },
      { pattern: /stack\s+overflow/i, message: "Stack overflow" },
    ];

    for (const { pattern, message } of patterns) {
      if (pattern.test(outputStr)) {
        warnings.push(message);
      }
    }

    return warnings;
  }

  private checkOutputSize(output: unknown): { truncated: boolean; message: string } {
    const size = JSON.stringify(output).length;
    const maxSize = 1_048_576; // 1MB

    if (size > maxSize) {
      return {
        truncated: true,
        message: `Output is ${size} bytes (exceeds ${maxSize} byte limit — truncated in audit log)`,
      };
    }

    return { truncated: false, message: "" };
  }
}
