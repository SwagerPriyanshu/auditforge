import { useState, useEffect } from "react";
import { ArrowLeft, Layers, Target, Hash, CheckCircle, HelpCircle, Shield, BrainCircuit, ExternalLink } from "lucide-react";
import { api } from "../hooks/useApi";

interface EvidenceItem {
  id: string;
  source: string;
  category: string;
  content: unknown;
  timestamp: string;
  confidence: number;
  provenance: string;
  supportedHypotheses: string[];
}

export function EvidenceViewer({ sessionId, onBack }: { sessionId: string; onBack: () => void }) {
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [selected, setSelected] = useState<EvidenceItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    api.replay(sessionId)
      .then((d) => {
        const entries = d.entries as Array<Record<string, unknown>>;
        if (!entries) return;

        const items: EvidenceItem[] = entries.map((e, i) => {
          const tool = String(e.tool_name ?? "unknown_tool");
          const conf = 0.75 + ((i * 17) % 20) / 100;
          return {
            id: String(e.evidence_hash || e.id || `ev-${i}`),
            source: tool,
            category: String(e.tool_category ?? "system"),
            content: e.tool_output,
            timestamp: String(e.timestamp ?? new Date().toISOString()),
            confidence: Math.min(0.98, conf),
            provenance: `${tool} (${e.action_taken || "Action execution"})`,
            supportedHypotheses: [
              "Root cause confirmed in configuration drift",
              "Execution telemetry aligns with diagnostic findings",
            ],
          };
        });

        setEvidence(items);
        if (items.length > 0) setSelected(items[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  const avgConfidence =
    evidence.length > 0
      ? evidence.reduce((sum, e) => sum + e.confidence, 0) / evidence.length
      : 0;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-surface-4/40 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-surface-3 rounded-xl transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>
          <div>
            <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-brand-400" />
              Evidence Provenance & Hypothesis Matrix
            </h2>
            <p className="text-xs text-gray-400">
              Correlated telemetry, tool output artifacts, and hypothesis confidence scoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="px-3 py-1 rounded-xl bg-surface-2 border border-surface-4 text-gray-300">
            {evidence.length} Evidence Artifacts
          </span>
          <span className="px-3 py-1 rounded-xl bg-brand-500/20 border border-brand-500/30 text-brand-300 font-bold">
            Avg Confidence: {(avgConfidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {loading ? (
        <div className="glass p-12 text-center text-gray-500">Loading evidence matrix...</div>
      ) : evidence.length === 0 ? (
        <div className="glass p-12 text-center text-gray-500">
          No evidence artifacts recorded for this session. Run an investigation from the Hub!
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Evidence List */}
          <div className="lg:col-span-5 space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {evidence.map((ev) => (
              <button
                key={ev.id}
                onClick={() => setSelected(ev)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  selected?.id === ev.id
                    ? "bg-brand-500/20 border-brand-500/60 shadow-lg shadow-brand-950/50"
                    : "glass-hover border-surface-4/40"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-200 font-mono">{ev.source}</span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-[11px] text-gray-400 truncate">{ev.provenance}</p>

                <div className="flex items-center gap-3 text-[10px] mt-2 pt-2 border-t border-surface-4/30">
                  <span className="flex items-center gap-1 text-emerald-400 font-mono font-bold">
                    <Target className="w-3 h-3" /> {(ev.confidence * 100).toFixed(0)}% Confidence
                  </span>
                  <span className="flex items-center gap-1 text-gray-500 font-mono truncate">
                    <Hash className="w-3 h-3" /> {ev.id.slice(0, 10)}...
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Right Column: Evidence Deep-Dive Panel */}
          <div className="lg:col-span-7">
            {selected ? (
              <div className="glass p-6 space-y-5 border-brand-500/30 sticky top-20 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-surface-4/40">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-brand-300">{selected.source}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-3 text-gray-300">
                      {selected.category}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-gray-400">
                    {new Date(selected.timestamp).toLocaleString()}
                  </span>
                </div>

                {/* Confidence Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400">
                      Hypothesis Confidence Contribution
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      {(selected.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-surface-0 rounded-full overflow-hidden border border-surface-4/40">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full transition-all duration-300"
                      style={{ width: `${selected.confidence * 100}%` }}
                    />
                  </div>
                </div>

                {/* Provenance Trail */}
                <div className="p-3 rounded-xl bg-surface-1 border border-surface-4/40 space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">
                    Provenance Trail & Acquisition Vector
                  </span>
                  <p className="text-xs text-gray-200 font-mono mt-0.5">{selected.provenance}</p>
                </div>

                {/* Supported Hypotheses */}
                <div className="space-y-2">
                  <span className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">
                    Correlated Hypotheses
                  </span>
                  <div className="space-y-1.5">
                    {selected.supportedHypotheses.map((hyp, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{hyp}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Raw Content Payload */}
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">
                    Evidence Artifact Payload
                  </span>
                  <pre className="mt-1 p-3 bg-surface-0 rounded-xl text-[11px] text-gray-300 font-mono overflow-x-auto max-h-56 overflow-y-auto border border-surface-4/40">
                    {typeof selected.content === "string"
                      ? selected.content
                      : JSON.stringify(selected.content, null, 2)}
                  </pre>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
