import { useState } from "react";
import { Shield, Check, X, Edit3, AlertTriangle, CornerDownRight } from "lucide-react";
import { RiskBadge } from "./RiskBadge";
import type { ApprovalRequest } from "../types";

interface Props {
  request: ApprovalRequest;
  onDecision: (callId: string, decision: string, modifiedInput?: Record<string, unknown>, reason?: string) => void;
}

export function ApprovalPanel({ request, onDecision }: Props) {
  const [reason, setReason] = useState("");
  const [isModifying, setIsModifying] = useState(false);
  const [modifiedJson, setModifiedJson] = useState(
    JSON.stringify(request.input || {}, null, 2)
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [decided, setDecided] = useState(false);

  const handle = (decision: string) => {
    let parsedInput: Record<string, unknown> | undefined = undefined;
    if (decision === "modify") {
      try {
        parsedInput = JSON.parse(modifiedJson);
      } catch (e) {
        setJsonError("Invalid JSON in modified input");
        return;
      }
    }
    setDecided(true);
    onDecision(request.id, decision, parsedInput, reason || undefined);
  };

  if (decided) {
    return (
      <div className="glass p-4 border-l-4 border-emerald-500 animate-fade-in flex items-center gap-2">
        <Check className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-semibold text-emerald-400">Decision processed & resumed</span>
      </div>
    );
  }

  const riskClass =
    request.riskScore >= 8
      ? "border-red-500/80 shadow-red-500/10"
      : request.riskScore >= 5
      ? "border-amber-500/80 shadow-amber-500/10"
      : "border-brand-500/80";

  return (
    <div className={`glass p-5 border-l-4 ${riskClass} shadow-xl animate-slide-up space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-100">Human Approval Gate</span>
              <RiskBadge score={request.riskScore} size="md" />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              The agent is paused waiting for your authorization before executing this action
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-3 text-gray-400">
          ID: {request.id.slice(0, 10)}
        </span>
      </div>

      {/* Action Target & Explanation */}
      <div className="p-3 bg-surface-1 rounded-xl border border-surface-4/40 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-brand-300">{request.toolName}</span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-300 font-medium">
            {request.explanation || "Action requires explicit authorization"}
          </span>
        </div>
      </div>

      {/* Consequences & Blast Radius */}
      {request.consequences && (
        <div className="p-3 bg-surface-0/80 rounded-xl border border-surface-4/60 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-gray-500">Blast Radius Assessment</span>
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
              request.consequences.reversible ? "text-emerald-400" : "text-rose-400"
            }`}>
              <span className={`w-2 h-2 rounded-full ${request.consequences.reversible ? "bg-emerald-400" : "bg-rose-400"}`} />
              {request.consequences.reversible ? "Reversible (Safe Rollback)" : "Irreversible Action"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
            <p className="text-gray-400">
              <strong className="text-gray-300">Worst Case:</strong> {request.consequences.worstCase}
            </p>
            <p className="text-gray-400">
              <strong className="text-gray-300">Expected Outcome:</strong> {request.consequences.bestCase}
            </p>
          </div>

          {request.consequences.mitigationSteps && request.consequences.mitigationSteps.length > 0 && (
            <div className="pt-1 text-[11px] text-gray-400">
              <strong className="text-gray-300">Safety Guardrails:</strong>
              <ul className="mt-0.5 ml-4 list-disc space-y-0.5">
                {request.consequences.mitigationSteps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Suggested Alternative */}
      {request.suggestedAlternative && (
        <div className="p-3 bg-brand-500/10 border border-brand-500/30 rounded-xl text-xs text-brand-300 flex items-start gap-2">
          <CornerDownRight className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-brand-200">Recommended Alternative:</strong> {request.suggestedAlternative}
          </div>
        </div>
      )}

      {/* Input Preview or Modification Editor */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">
            {isModifying ? "Modify Tool Arguments (JSON)" : "Proposed Tool Input"}
          </span>
          <button
            onClick={() => setIsModifying(!isModifying)}
            className="text-[11px] text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium"
          >
            <Edit3 className="w-3 h-3" /> {isModifying ? "Cancel Editing" : "Modify Parameters"}
          </button>
        </div>

        {isModifying ? (
          <div className="space-y-1">
            <textarea
              value={modifiedJson}
              onChange={(e) => {
                setModifiedJson(e.target.value);
                setJsonError(null);
              }}
              rows={4}
              className="w-full p-2.5 bg-surface-0 border border-brand-500/50 rounded-xl text-xs text-brand-200 font-mono focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
            {jsonError && <p className="text-xs text-rose-400">{jsonError}</p>}
          </div>
        ) : (
          <pre className="p-3 bg-surface-0 rounded-xl text-[11px] text-gray-300 font-mono overflow-x-auto max-h-32 border border-surface-4/40">
            {JSON.stringify(request.input, null, 2)}
          </pre>
        )}
      </div>

      {/* Optional Reason / Notes */}
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Optional reason or review note for the audit ledger..."
        className="w-full px-3 py-2 bg-surface-0 border border-surface-4 rounded-xl text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500/50"
      />

      {/* Decision Buttons */}
      <div className="flex items-center gap-2 pt-1">
        {isModifying ? (
          <button
            onClick={() => handle("modify")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-brand-950/50"
          >
            <Check className="w-4 h-4" /> Approve with Modified Parameters
          </button>
        ) : (
          <button
            onClick={() => handle("approve")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-emerald-950/50"
          >
            <Check className="w-4 h-4" /> Authorize & Proceed
          </button>
        )}

        <button
          onClick={() => handle("deny")}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-3 hover:bg-rose-950/80 hover:text-rose-300 text-gray-300 text-xs font-semibold rounded-xl transition-all border border-surface-4 hover:border-rose-800/60"
        >
          <X className="w-4 h-4" /> Deny & Abort Action
        </button>
      </div>
    </div>
  );
}
