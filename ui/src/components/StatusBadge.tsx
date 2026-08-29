import clsx from "clsx";
import type { SessionStatus } from "../types";

const STATUS_CONFIG: Record<
  SessionStatus,
  { bg: string; text: string; border: string; dot: string; label: string; pulse: boolean }
> = {
  created: { bg: "bg-slate-500/10", text: "text-slate-300", border: "border-slate-500/20", dot: "bg-slate-400", label: "Created", pulse: false },
  planning: { bg: "bg-blue-500/10", text: "text-blue-300", border: "border-blue-500/25", dot: "bg-blue-400", label: "Planning", pulse: true },
  gathering_evidence: { bg: "bg-purple-500/10", text: "text-purple-300", border: "border-purple-500/25", dot: "bg-purple-400", label: "Gathering", pulse: true },
  forming_hypotheses: { bg: "bg-cyan-500/10", text: "text-cyan-300", border: "border-cyan-500/25", dot: "bg-cyan-400", label: "Hypothesizing", pulse: true },
  testing_hypotheses: { bg: "bg-indigo-500/10", text: "text-indigo-300", border: "border-indigo-500/25", dot: "bg-indigo-400", label: "Testing", pulse: true },
  reaching_conclusion: { bg: "bg-violet-500/10", text: "text-violet-300", border: "border-violet-500/25", dot: "bg-violet-400", label: "Concluding", pulse: true },
  awaiting_approval: { bg: "bg-amber-500/15", text: "text-amber-300", border: "border-amber-500/30", dot: "bg-amber-400", label: "Human Gate", pulse: true },
  executing_action: { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/25", dot: "bg-emerald-400", label: "Executing", pulse: true },
  verifying_outcome: { bg: "bg-teal-500/10", text: "text-teal-300", border: "border-teal-500/25", dot: "bg-teal-400", label: "Verifying", pulse: true },
  generating_report: { bg: "bg-sky-500/10", text: "text-sky-300", border: "border-sky-500/25", dot: "bg-sky-400", label: "Attesting", pulse: true },
  completed: { bg: "bg-emerald-500/15", text: "text-emerald-300", border: "border-emerald-500/30", dot: "bg-emerald-400", label: "Completed", pulse: false },
  failed: { bg: "bg-rose-500/15", text: "text-rose-300", border: "border-rose-500/30", dot: "bg-rose-400", label: "Failed", pulse: false },
  aborted: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20", dot: "bg-slate-500", label: "Aborted", pulse: false },
};

export function StatusBadge({ status }: { status: SessionStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.created;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono border font-medium",
        cfg.bg,
        cfg.text,
        cfg.border
      )}
    >
      <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot, cfg.pulse && "animate-pulse")} />
      <span>{cfg.label}</span>
    </span>
  );
}
