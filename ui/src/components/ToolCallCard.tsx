import { useState } from "react";
import { Wrench, ChevronDown, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { RiskBadge } from "./RiskBadge";
import type { AuditEntry } from "../types";

export function ToolCallCard({ entry }: { entry: AuditEntry }) {
  const [expanded, setExpanded] = useState(false);

  let input: Record<string, unknown> = {};
  let output: unknown = null;
  try { input = JSON.parse(entry.toolInput); } catch { /* */ }
  try { output = JSON.parse(entry.toolOutput); } catch { output = entry.toolOutput; }

  return (
    <div className="glass-hover p-3 animate-fade-in" onClick={() => setExpanded(!expanded)}>
      <div className="flex items-center gap-2 cursor-pointer">
        <Wrench className="w-3.5 h-3.5 text-brand-400 shrink-0" />
        <span className="text-sm font-medium text-gray-200 truncate">{entry.toolName}</span>
        <RiskBadge score={entry.riskScore} />
        <span className="text-[10px] text-gray-500 shrink-0">{new Date(entry.timestamp).toLocaleTimeString()}</span>
        <div className="ml-auto flex items-center gap-1.5">
          {entry.approved
            ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            : <XCircle className="w-3.5 h-3.5 text-gray-500" />
          }
          {expanded ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 animate-slide-up">
          <div>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Input</span>
            <pre className="mt-1 p-2 bg-surface-0 rounded-lg text-[11px] text-gray-400 font-mono overflow-x-auto max-h-40 overflow-y-auto">
              {JSON.stringify(input, null, 2)}
            </pre>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Output</span>
            <pre className="mt-1 p-2 bg-surface-0 rounded-lg text-[11px] text-gray-400 font-mono overflow-x-auto max-h-40 overflow-y-auto">
              {typeof output === "string" ? output : JSON.stringify(output, null, 2)}
            </pre>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
            <span>Category: {entry.toolCategory}</span>
            <span>•</span>
            <span>Action: {entry.actionTaken}</span>
            <span>•</span>
            <span>Hash: {entry.evidenceHash.slice(0, 12)}...</span>
          </div>
        </div>
      )}
    </div>
  );
}
