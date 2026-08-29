import {
  Brain, Wrench, CheckCircle2, XCircle, Shield, Users,
  FileCode, MessageSquare, AlertTriangle, Loader2,
} from "lucide-react";
import { RiskBadge } from "./RiskBadge";
import type { AgentEvent } from "../types";

const EVENT_ICONS: Record<string, { icon: typeof Brain; color: string }> = {
  thinking: { icon: Brain, color: "text-indigo-400" },
  plan_created: { icon: FileCode, color: "text-blue-400" },
  evidence_collected: { icon: CheckCircle2, color: "text-emerald-400" },
  hypothesis_formed: { icon: Brain, color: "text-cyan-400" },
  hypothesis_tested: { icon: Brain, color: "text-violet-400" },
  conclusion_reached: { icon: CheckCircle2, color: "text-green-400" },
  approval_request: { icon: Shield, color: "text-amber-400" },
  approval_decision: { icon: Shield, color: "text-amber-400" },
  action_executed: { icon: Wrench, color: "text-purple-400" },
  outcome_verified: { icon: CheckCircle2, color: "text-emerald-400" },
  report_generated: { icon: FileCode, color: "text-sky-400" },
  tool_call: { icon: Wrench, color: "text-purple-400" },
  tool_result: { icon: CheckCircle2, color: "text-green-400" },
  message: { icon: MessageSquare, color: "text-indigo-400" },
  error: { icon: XCircle, color: "text-red-400" },
  complete: { icon: CheckCircle2, color: "text-green-400" },
};

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

export function Timeline({ events }: { events: AgentEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <Brain className="w-10 h-10 mb-3 opacity-20" />
        <p className="text-sm">Waiting for events...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event) => {
        const cfg = EVENT_ICONS[event.type] ?? EVENT_ICONS.message;
        const Icon = cfg.icon;
        const data = event.data as Record<string, unknown>;
        const content = typeof data.content === "string" ? data.content : null;
        const riskScore = typeof data.riskScore === "number" ? data.riskScore : null;

        return (
          <div key={event.id} className="flex gap-3 animate-fade-in">
            {/* Line + dot */}
            <div className="flex flex-col items-center">
              <div className={`mt-1 ${cfg.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="w-px flex-1 bg-surface-4" />
            </div>

            {/* Content */}
            <div className="flex-1 pb-3">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{event.type.replace(/_/g, " ")}</span>
                {riskScore !== null && <RiskBadge score={riskScore} />}
                <span className="text-[10px] text-gray-600 ml-auto">{formatTime(event.timestamp)}</span>
              </div>
              {content && <p className="text-sm text-gray-300">{String(content)}</p>}

              {/* Tool call details */}
              {event.type === "tool_call" && typeof data.toolName === "string" && (
                <div className="mt-1 p-2 bg-surface-0 rounded-lg">
                  <span className="text-xs text-purple-300 font-mono">{String(data.toolName)}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
