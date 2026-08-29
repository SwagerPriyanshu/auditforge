import { useState, useEffect } from "react";
import {
  Shield,
  Plus,
  Play,
  RotateCcw,
  Layers,
  Lock,
  Cpu,
  Flame,
  Key,
  GitPullRequest,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Terminal,
  Activity,
  Zap,
  Clock,
  Radio,
  FileCode,
  CheckCircle,
  Copy,
} from "lucide-react";
import { api } from "../hooks/useApi";
import { useWebSocket } from "../hooks/useWebSocket";
import { StatusBadge } from "./StatusBadge";
import { Timeline } from "./Timeline";
import { ApprovalPanel } from "./ApprovalPanel";
import { ToolCallCard } from "./ToolCallCard";
import type { Session, AuditEntry, ApprovalRequest } from "../types";

interface Props {
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNavigate: (tab: any) => void;
}

const STAGES = [
  { id: "planning", label: "Plan & Scope", step: 1 },
  { id: "gathering_evidence", label: "Gather Evidence", step: 2 },
  { id: "forming_hypotheses", label: "Hypotheses", step: 3 },
  { id: "testing_hypotheses", label: "Test Hypotheses", step: 4 },
  { id: "reaching_conclusion", label: "Root Cause", step: 5 },
  { id: "awaiting_approval", label: "Human Gate", step: 6 },
  { id: "executing_action", label: "Safe Execution", step: 7 },
  { id: "generating_report", label: "Merkle Proof", step: 8 },
  { id: "completed", label: "Attested", step: 9 },
];

export function Dashboard({ activeSessionId, onSelectSession, onNavigate }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [title, setTitle] = useState("");
  const [incident, setIncident] = useState("");
  const [model, setModel] = useState("gpt-4o");
  const [starting, setStarting] = useState(false);
  const [presetLoading, setPresetLoading] = useState<string | null>(null);

  const { events, connected } = useWebSocket(activeSessionId);

  // Load sessions
  const loadSessions = async () => {
    try {
      const data = await api.getSessions();
      const s = data.sessions as unknown as Session[];
      setSessions(s);
      if (!activeSessionId && s.length > 0) {
        onSelectSession(s[0].id);
      }
    } catch { /* */ }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // Load session audit entries and pending approvals
  useEffect(() => {
    if (!activeSessionId) {
      setEntries([]);
      setApprovals([]);
      return;
    }
    api.getAuditLog(activeSessionId)
      .then((d) => setEntries(d.entries as unknown as AuditEntry[]))
      .catch(() => {});
    api.getPendingApprovals(activeSessionId)
      .then((d) => setApprovals(d.pending as unknown as ApprovalRequest[]))
      .catch(() => {});
  }, [activeSessionId, events.length]);

  // Create custom session
  const handleCreate = async () => {
    if (!title.trim() || !incident.trim()) return;
    setStarting(true);
    try {
      const session = (await api.createSession({
        title: title.trim(),
        incident: incident.trim(),
        model,
      })) as unknown as Session;
      setSessions((prev) => [session, ...prev]);
      onSelectSession(session.id);
      setShowNewModal(false);
      setTitle("");
      setIncident("");
      await api.investigate(session.id);
    } catch { /* */ }
    setStarting(false);
  };

  // Launch pre-configured demo preset
  const handleLaunchPreset = async (presetKey: string) => {
    setPresetLoading(presetKey);
    try {
      const session = (await api.runPreset(presetKey)) as unknown as Session;
      setSessions((prev) => [session, ...prev]);
      onSelectSession(session.id);
    } catch { /* */ }
    setPresetLoading(null);
  };

  // Handle human approval decision
  const handleApproval = async (
    callId: string,
    decision: string,
    modifiedInput?: Record<string, unknown>,
    reason?: string
  ) => {
    if (!activeSessionId) return;
    await api.approve(activeSessionId, { callId, decision, modifiedInput, reason });
    setApprovals((prev) => prev.filter((a) => a.id !== callId));
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Calculate current stage index
  const currentStageIndex = STAGES.findIndex((st) => st.id === activeSession?.status);

  // Compute live session stats
  const totalRisk = entries.reduce((sum, e) => sum + (e.riskScore || 0), 0);
  const avgRisk = entries.length > 0 ? (totalRisk / entries.length).toFixed(1) : "0.0";
  const maxRisk = entries.reduce((max, e) => Math.max(max, e.riskScore || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quick 1-Click Judge Demo Scenarios Deck */}
      <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-r from-surface-1/95 via-surface-2/90 to-surface-1/95 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
              <h2 className="text-sm font-black text-gray-100 uppercase tracking-widest font-mono flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Judge Demo Scenarios (1-Click Execution)
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Select any pre-configured scenario to see <strong>TrueForge MCP tool calls, dynamic risk scoring, sandboxed execution, and human approval checkpoints</strong> in action:
            </p>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-950/60 ring-1 ring-white/20 transition-all shrink-0 hover:scale-105"
          >
            <Plus className="w-4 h-4" /> New Custom Incident
          </button>
        </div>

        {/* 4 Preset Cards with rich neon glass styling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
          {[
            {
              key: "connection_pool",
              tag: "INCIDENT TRIAGE",
              title: "500 Connection Starvation",
              desc: "Diagnoses DB pool exhaustion, verifies Postgres telemetry, applies config fix",
              icon: Flame,
              border: "border-amber-500/40 hover:border-amber-400",
              bg: "from-amber-500/10 via-surface-2 to-surface-1",
              badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
              btn: "text-amber-300 group-hover:text-amber-200",
            },
            {
              key: "secret_leak",
              tag: "SECURITY GOVERNANCE",
              title: "AWS Secret Exposure",
              desc: "Detects unmasked credentials in commit history & staging env, triggers alert",
              icon: Key,
              border: "border-rose-500/40 hover:border-rose-400",
              bg: "from-rose-500/10 via-surface-2 to-surface-1",
              badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
              btn: "text-rose-300 group-hover:text-rose-200",
            },
            {
              key: "pr_flaky",
              tag: "CI/CD REMEDIATION",
              title: "Flaky PR #42 Failure",
              desc: "Triages checkout test timeouts, crafts fix PR patch, comments on review trail",
              icon: GitPullRequest,
              border: "border-brand-500/40 hover:border-brand-400",
              bg: "from-brand-500/10 via-surface-2 to-surface-1",
              badge: "bg-brand-500/20 text-brand-300 border-brand-500/40",
              btn: "text-brand-300 group-hover:text-brand-200",
            },
            {
              key: "dangerous_deletion",
              tag: "HUMAN CHECKPOINT",
              title: "Critical Deletion Gate",
              desc: "Risk 9/10 command attempt pauses the harness and awaits Human Approval",
              icon: Trash2,
              border: "border-orange-500/50 hover:border-orange-400 ring-1 ring-orange-500/30",
              bg: "from-orange-500/15 via-surface-2 to-surface-1",
              badge: "bg-orange-500/25 text-orange-300 border-orange-500/50",
              btn: "text-orange-300 group-hover:text-orange-200",
            },
          ].map((preset) => {
            const Icon = preset.icon;
            const isLoading = presetLoading === preset.key;
            return (
              <button
                key={preset.key}
                onClick={() => handleLaunchPreset(preset.key)}
                disabled={Boolean(presetLoading)}
                className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all bg-gradient-to-b ${preset.bg} ${preset.border} hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-2xl disabled:opacity-50 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${preset.badge}`}>
                      {preset.tag}
                    </span>
                    <Icon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xs font-bold text-gray-100 group-hover:text-white">{preset.title}</h3>
                  <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">{preset.desc}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between">
                  <span className={`text-[11px] font-mono font-bold flex items-center gap-1.5 ${preset.btn}`}>
                    {isLoading ? "Executing Agent Loop..." : "Run Test ➔"}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">TrueForge MCP</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
        {/* Left Column: Sessions, Stats, & Navigation */}
        <aside className="lg:col-span-4 space-y-4">
          {/* Active Session Overview Card */}
          {activeSession ? (
            <div className="glass-card p-5 space-y-4 border-brand-500/40">
              <div className="flex items-center justify-between">
                <StatusBadge status={activeSession.status} />
                <span className="text-[10px] font-mono text-gray-400">
                  {new Date(activeSession.createdAt).toLocaleTimeString()}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-100">{activeSession.title}</h3>
                <div className="mt-2 p-3 rounded-xl bg-surface-0/80 border border-white/[0.06] text-xs text-gray-300 font-mono line-clamp-3">
                  {activeSession.incident}
                </div>
              </div>

              {/* Real-time Session Telemetry Strip */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
                <div className="p-2.5 bg-surface-1 rounded-xl border border-white/[0.06]">
                  <span className="text-[10px] text-gray-500 uppercase">Tool Calls</span>
                  <p className="text-sm font-bold text-gray-200 mt-0.5">{entries.length}</p>
                </div>
                <div className="p-2.5 bg-surface-1 rounded-xl border border-white/[0.06]">
                  <span className="text-[10px] text-gray-500 uppercase">Avg Risk</span>
                  <p className={`text-sm font-bold mt-0.5 ${Number(avgRisk) > 6 ? "text-rose-400" : "text-emerald-400"}`}>
                    {avgRisk}/10
                  </p>
                </div>
                <div className="p-2.5 bg-surface-1 rounded-xl border border-white/[0.06]">
                  <span className="text-[10px] text-gray-500 uppercase">Peak Risk</span>
                  <p className={`text-sm font-bold mt-0.5 ${maxRisk > 6 ? "text-rose-400" : "text-brand-300"}`}>
                    {maxRisk}/10
                  </p>
                </div>
              </div>

              {/* View Deep-Dive Shortcuts */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => onNavigate("audit")}
                  className="flex items-center justify-center gap-2 p-2.5 bg-surface-2 hover:bg-surface-3 rounded-xl text-xs font-semibold text-gray-200 transition-all border border-white/[0.06]"
                >
                  <Shield className="w-3.5 h-3.5 text-brand-400" /> Audit Ledger
                </button>
                <button
                  onClick={() => onNavigate("replay")}
                  className="flex items-center justify-center gap-2 p-2.5 bg-surface-2 hover:bg-surface-3 rounded-xl text-xs font-semibold text-gray-200 transition-all border border-white/[0.06]"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400" /> Replay Player
                </button>
              </div>
            </div>
          ) : null}

          {/* Sessions List */}
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-gray-400 uppercase font-mono tracking-wider">
                Sessions ({sessions.length})
              </span>
              <button
                onClick={loadSessions}
                className="text-[10px] text-brand-400 hover:text-brand-300 font-mono"
              >
                Refresh
              </button>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {sessions.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-500">
                  No sessions created yet. Run a demo scenario above!
                </div>
              ) : (
                sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onSelectSession(s.id)}
                    className={`w-full text-left p-3 rounded-xl text-xs transition-all border ${
                      activeSessionId === s.id
                        ? "bg-brand-500/20 border-brand-500/60 shadow-lg shadow-brand-950/50"
                        : "bg-surface-1/70 hover:bg-surface-2 border-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <StatusBadge status={s.status} />
                      <span className="text-[10px] text-gray-500 font-mono">
                        {new Date(s.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-200 truncate">{s.title}</p>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5 font-mono">{s.incident}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Right Column: Stage Progress, Approval Gate, & Live Stream Terminal */}
        <main className="lg:col-span-8 flex flex-col gap-4">
          {/* Investigation Stage Progress Pipeline */}
          <div className="glass-card p-4 overflow-x-auto border-white/[0.08]">
            <div className="flex items-center gap-2 min-w-[700px] text-xs">
              {STAGES.map((st, i) => {
                const isPassed = currentStageIndex > i || activeSession?.status === "completed";
                const isCurrent = activeSession?.status === st.id;
                return (
                  <div key={st.id} className="flex items-center gap-1.5 flex-1">
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-[10px] font-bold transition-all whitespace-nowrap ${
                        isCurrent
                          ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/40 ring-2 ring-brand-400/50 animate-pulse"
                          : isPassed
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-surface-3/60 text-gray-500"
                      }`}
                    >
                      {isPassed && !isCurrent ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <span className="w-3 h-3 rounded-full bg-white/20 flex items-center justify-center text-[8px]">
                          {st.step}
                        </span>
                      )}
                      <span>{st.label}</span>
                    </div>
                    {i < STAGES.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 ${
                          isPassed ? "bg-emerald-500/50" : "bg-surface-4/40"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Human Approval Gate Alert / Drawer */}
          {approvals.length > 0 && (
            <div className="space-y-3">
              {approvals.map((a) => (
                <ApprovalPanel
                  key={a.id}
                  request={a}
                  onDecision={handleApproval}
                />
              ))}
            </div>
          )}

          {/* Live Execution Stream Terminal */}
          <div className="flex-1 glass-card p-5 flex flex-col min-h-[460px] border-white/[0.08] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-brand-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-200 font-mono">
                  Live Agent Execution Stream & Intercepted Calls
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400 animate-ping" : "bg-gray-500"}`} />
                <span className="text-[11px] text-gray-400 font-mono font-semibold">
                  {connected ? "SSE Stream: Active" : "Local Ledger"}
                </span>
              </div>
            </div>

            {/* Stream Content */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {events.length > 0 ? (
                <Timeline events={events} />
              ) : entries.length > 0 ? (
                <div className="space-y-3">
                  {entries.map((e) => (
                    <ToolCallCard key={e.id} entry={e} />
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 text-gray-500">
                  <Shield className="w-14 h-14 mb-3 opacity-20 text-brand-400" />
                  <p className="text-sm font-bold text-gray-300">No active events in stream</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm leading-relaxed">
                    Click any of the 4 Judge Demo Scenarios at the top to trigger tool calls, risk assessments, sandboxed execution, and cryptographic attestation.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* New Incident Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card max-w-lg w-full p-6 space-y-4 border-brand-500/50 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-400" /> Start Custom Investigation
              </h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-gray-400 hover:text-gray-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 font-medium mb-1">Incident Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Memory Spike in Production Auth Service"
                  className="w-full px-3 py-2 bg-surface-0 border border-surface-4 rounded-xl text-gray-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-medium mb-1">Incident Description</label>
                <textarea
                  value={incident}
                  onChange={(e) => setIncident(e.target.value)}
                  placeholder="Describe the symptoms, error logs, and affected components..."
                  rows={4}
                  className="w-full px-3 py-2 bg-surface-0 border border-surface-4 rounded-xl text-gray-200 focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-medium mb-1">Reasoning Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-0 border border-surface-4 rounded-xl text-gray-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="gpt-4o">OpenAI GPT-4o (Default)</option>
                  <option value="claude-3.5-sonnet">Anthropic Claude 3.5 Sonnet</option>
                  <option value="gemini-2.0-flash">Google Gemini 2.0 Flash</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 bg-surface-3 hover:bg-surface-4 text-gray-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={starting || !title.trim() || !incident.trim()}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg disabled:opacity-40"
              >
                {starting ? "Starting..." : "Launch Investigation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
