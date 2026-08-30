/**
 * AuditForge — Real LLM Client & Cognitive Reasoning Engine
 *
 * Connects to NVIDIA NIM (e.g. DeepSeek-V4) or OpenAI-compatible endpoints.
 * Provides live AI reasoning for:
 *   - Incident comprehension & hypothesis formulation
 *   - Evidence evaluation & contradiction detection
 *   - Root-cause synthesis & remediation recommendation
 *
 * Includes graceful heuristic fallback if offline or unconfigured.
 */

import { logger } from "../interception/logger";
import { INVESTIGATOR_SYSTEM_PROMPT } from "./prompts";
import type { Evidence, Hypothesis, Conclusion, Action } from "../types";

export interface LLMConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
}

export class LLMEngine {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private timeoutMs: number;

  constructor(config?: LLMConfig) {
    this.apiKey = config?.apiKey ?? process.env.OPENAI_API_KEY ?? "";
    this.baseUrl = (config?.baseUrl ?? process.env.OPENAI_BASE_URL ?? "https://integrate.api.nvidia.com/v1").replace(/\/+$/, "");
    this.model = config?.model ?? process.env.OPENAI_MODEL ?? "deepseek-ai/deepseek-v4-pro-0813";
    this.timeoutMs = config?.timeoutMs ?? 3000;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5);
  }

  getModelInfo(): { provider: string; model: string; baseUrl: string; active: boolean } {
    return {
      provider: this.baseUrl.includes("nvidia.com") ? "NVIDIA NIM" : "OpenAI",
      model: this.model,
      baseUrl: this.baseUrl,
      active: this.isConfigured(),
    };
  }

  private async chatCompletion(messages: Array<{ role: "system" | "user" | "assistant"; content: string }>, maxTokens = 1024, temperature = 0.2): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("LLM API key not configured");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`LLM API returned HTTP ${res.status}: ${errorText}`);
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const reply = data.choices?.[0]?.message?.content ?? "";
      return reply.trim();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Use the live LLM to generate intelligent hypotheses based on the incident and gathered evidence.
   */
  async generateHypotheses(incident: string, evidence: Evidence[]): Promise<Hypothesis[] | null> {
    if (!this.isConfigured()) return null;

    try {
      const evidenceSummary = evidence.map((e, idx) => `[Evidence #${idx + 1} (${e.source})]: ${JSON.stringify(e.content).slice(0, 300)}`).join("\n");

      const prompt = `You are AuditForge's incident reasoning engine.
INCIDENT:
${incident}

GATHERED EVIDENCE:
${evidenceSummary || "No initial evidence yet."}

Analyze the incident and evidence. Return a JSON array with 3 to 4 distinct testable hypotheses about the root cause.
Format your output as strictly valid JSON matching this schema:
[
  {
    "description": "Short explanation of the root cause hypothesis",
    "confidence": 0.65,
    "rationale": "Why this hypothesis makes sense based on evidence"
  }
]
Output only the JSON array.`;

      const response = await this.chatCompletion(
        [
          { role: "system", content: INVESTIGATOR_SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        800,
        0.1
      );

      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]) as Array<{
        description: string;
        confidence: number;
        rationale?: string;
      }>;

      if (!Array.isArray(parsed) || parsed.length === 0) return null;

      return parsed.map((item, idx) => ({
        id: `hyp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        description: item.description,
        evidenceSupporting: [],
        evidenceContradicting: [],
        confidence: Math.max(0.1, Math.min(0.95, Number(item.confidence) || 0.5)),
        status: "proposed",
      }));
    } catch (err) {
      logger.warn("LLMEngine", "Failed to generate LLM hypotheses, using heuristic fallback", {
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  }

  /**
   * Use the live LLM to reach a synthesized root-cause conclusion and recommended action.
   */
  async generateConclusion(
    incident: string,
    hypotheses: Hypothesis[],
    evidence: Evidence[]
  ): Promise<{ summary: string; confidence: number; actionDescription?: string; toolName?: string; toolInput?: Record<string, unknown> } | null> {
    if (!this.isConfigured()) return null;

    try {
      const topHypothesis = [...hypotheses].sort((a, b) => b.confidence - a.confidence)[0];
      const evidenceList = evidence.map((e, idx) => `[E#${idx + 1}] Source: ${e.source} -> Content: ${JSON.stringify(e.content).slice(0, 250)}`).join("\n");

      const prompt = `You are AuditForge's incident conclusion synthesizer.
INCIDENT:
${incident}

TOP HYPOTHESIS:
${topHypothesis ? topHypothesis.description : "Under investigation"}

GATHERED EVIDENCE:
${evidenceList}

Synthesize the final root cause conclusion and recommend a safe, audited corrective action.
Respond ONLY with a JSON object in this exact schema:
{
  "summary": "Clear, concise 1-2 sentence statement of the proven root cause",
  "confidence": 0.92,
  "actionDescription": "Action to remediate the incident",
  "toolName": "write_file",
  "toolInput": {
    "path": "./config/redis.yaml",
    "content": "pool_size: 20\\nrotation: enabled\\n"
  }
}`;

      const response = await this.chatCompletion(
        [
          { role: "system", content: INVESTIGATOR_SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        600,
        0.1
      );

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]) as {
        summary: string;
        confidence: number;
        actionDescription?: string;
        toolName?: string;
        toolInput?: Record<string, unknown>;
      };

      if (!parsed.summary) return null;

      return {
        summary: parsed.summary,
        confidence: Math.max(0.1, Math.min(0.99, Number(parsed.confidence) || 0.85)),
        actionDescription: parsed.actionDescription,
        toolName: parsed.toolName,
        toolInput: parsed.toolInput,
      };
    } catch (err) {
      logger.warn("LLMEngine", "Failed to generate LLM conclusion, using heuristic fallback", {
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  }
}

export const llmEngine = new LLMEngine();
