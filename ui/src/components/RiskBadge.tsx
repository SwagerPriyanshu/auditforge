import clsx from "clsx";

const RISK_STYLES: Record<number, { class: string; label: string }> = {
  1: { class: "risk-safe", label: "Safe" },
  2: { class: "risk-safe", label: "Safe" },
  3: { class: "risk-low", label: "Low" },
  4: { class: "risk-low", label: "Low" },
  5: { class: "risk-medium", label: "Medium" },
  6: { class: "risk-medium", label: "Medium" },
  7: { class: "risk-high", label: "High" },
  8: { class: "risk-high", label: "High" },
  9: { class: "risk-critical", label: "Critical" },
  10: { class: "risk-critical", label: "Critical" },
};

export function RiskBadge({ score, size = "sm" }: { score: number; size?: "sm" | "md" }) {
  const style = RISK_STYLES[Math.min(10, Math.max(1, score))] ?? RISK_STYLES[5];
  return (
    <span className={clsx(
      "inline-flex items-center gap-1 rounded-full border font-medium",
      style.class,
      size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
    )}>
      <span className="font-mono">{score}</span>
      <span className="hidden sm:inline">{style.label}</span>
    </span>
  );
}

export function RiskBar({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color = score <= 3 ? "bg-emerald-500" : score <= 6 ? "bg-yellow-500" : score <= 8 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="w-full h-1.5 bg-surface-4 rounded-full overflow-hidden">
      <div className={clsx("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}
