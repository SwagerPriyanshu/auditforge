import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  Lock,
  Layers,
  Database,
  Terminal,
  Cpu,
  Clock,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { api } from "../hooks/useApi";
import { useWebSocket } from "../hooks/useWebSocket";
import { StatusBadge } from "../components/StatusBadge";
import { Timeline } from "../components/Timeline";
import { ApprovalPanel } from "../components/ApprovalPanel";
import { ToolCallCard } from "../components/ToolCallCard";
import { MerkleGraph } from "../components/MerkleGraph";
import type { Session, AuditEntry, ApprovalRequest } from "../types";

const STAGES = [
  { id: "planning", label: "Plan & Scope" },
  { id: "gathering_evidence", label: "Gather Evidence" },
  { id: "forming_hypotheses", label: "Hypotheses" },
  { id: "testing_hypotheses", label: "Test Hypotheses" },
  { id: "reaching_conclusion", label: "Root Cause" },
  { id: "awaiting_approval", label: "Human Gate" },
  { id: "executing_action", label: "Safe Execution" },
  { id: "generating_report", label: "Merkle Proof" },
  { id: "completed", label: "Attested" },
];

export function InvestigationPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const { events, connected } = useWebSocket(id || null);

  const loadData = async () => {
    if (!id) return;
    try {
      const [sData, logData, aprData] = await Promise.all([
        api.getSession(id).catch(() => null),
        api.getAuditLog(id).catch(() => null),
        api.getPendingApprovals(id).catch(() => null),
      ]);
      if (sData) setSession(sData as unknown as Session);
      if (logData && logData.entries) setEntries(logData.entries as unknown as AuditEntry[]);
      if (aprData && aprData.pending) setApprovals(aprData.pending as unknown as ApprovalRequest[]);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id, events.length]);

  const handleApproval = async (
    callId: string,
    decision: string,
    modifiedInput?: Record<string, unknown>,
    reason?: string
  ) => {
    if (!id) return;
    await api.approve(id, { callId, decision, modifiedInput, reason });
    setApprovals((prev) => prev.filter((a) => a.id !== callId));
    loadData();
  };

  const currentStageIndex = STAGES.findIndex((st) => st.id === session?.status);

  if (loading && !session) {
    return (
      <div className="card p-12 text-center text-zinc-500 text-xs">
        Loading investigation workspace for session {id}...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="card p-12 text-center text-zinc-400 space-y-3">
        <AlertTriangle className="w-8 h-8 mx-auto text-amber-400 opacity-80" />
        <h3 className="text-sm font-bold text-zinc-200">Investigation Session Not Found</h3>
        <p className="text-xs text-zinc-500">The requested session ID does not exist in local storage.</p>
        <Link to="/" className="inline-block px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold">
          Return to Command Center
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Session Header Card */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <StatusBadge status={session.status} />
              <span className="text-xs text-zinc-500 font-mono">ID: {session.id}</span>
              <span className="text-xs text-zinc-500">•</span>
              <span className="text-xs text-zinc-400 font-mono">{session.model}</span>
            </div>
            <h1 className="text-lg font-bold text-zinc-100">{session.title}</h1>
            <p className="text-xs text-zinc-400 font-mono bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800/80 max-w-4xl">
              {session.incident}
            </p>
          </div>

          {/* Quick Deep-Dive Links */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Link
              to={`/audit/${session.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold transition-colors border border-zinc-700/60"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" /> Audit Ledger
            </Link>
            <Link
              to={`/replay/${session.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold transition-colors border border-zinc-700/60"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" /> Replay
            </Link>
            <Link
              to={`/attestation/${session.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold transition-colors border border-zinc-700/60"
            >
              <Lock className="w-3.5 h-3.5 text-cyan-400" /> Proof Cert
            </Link>
          </div>
        </div>

        {/* Stage Progression Pipeline */}
        <div className="pt-2 border-t border-zinc-800 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-[700px] text-xs">
            {STAGES.map((st, i) => {
              const isPassed = currentStageIndex > i || session.status === "completed";
              const isCurrent = session.status === st.id;
              return (
                <div key={st.id} className="flex items-center gap-1.5 flex-1">
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[10px] font-semibold transition-all whitespace-nowrap ${
                      isCurrent
                        ? "bg-indigo-600 text-white ring-2 ring-indigo-500/40"
                        : isPassed
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                        : "bg-zinc-900 text-zinc-500"
                    }`}
                  >
                    {isPassed && !isCurrent ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : null}
                    <span>{st.label}</span>
                  </div>
                  {i < STAGES.length - 1 && (
                    <div className={`h-0.5 flex-1 ${isPassed ? "bg-emerald-500/40" : "bg-zinc-800"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Split Screen Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Live Execution Stream */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card p-4 min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-mono">
                  Agent Execution Loop
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`} />
                <span className="text-[11px] text-zinc-400 font-mono">
                  {connected ? "SSE Stream: Active" : "Local History"}
                </span>
              </div>
            </div>

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
                <div className="h-full flex flex-col items-center justify-center p-12 text-center text-zinc-500 text-xs">
                  <Shield className="w-10 h-10 mb-2 opacity-20 text-indigo-400" />
                  No events recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Human Gate & Context */}
        <div className="lg:col-span-5 space-y-4">
          {/* Pending Human Approval Drawer */}
          {approvals.length > 0 ? (
            <div className="space-y-3">
              {approvals.map((a) => (
                <ApprovalPanel key={a.id} request={a} onDecision={handleApproval} />
              ))}
            </div>
          ) : (
            <div className="card p-4 flex items-center justify-between border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-emerald-300">Human Approval Gate Status</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">No Blocked Operations</span>
            </div>
          )}

          {/* Merkle Cryptographic Proof Graph */}
          <MerkleGraph
            merkleRoot={session.merkleRoot}
            entriesCount={entries.length || 5}
            className="border-indigo-500/20"
          />

          {/* Quick Context & Attestation Box */}
          <div className="card p-4 space-y-3">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
              Investigation Telemetry
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase">Tool Interceptions</span>
                <p className="text-sm font-bold text-zinc-200 mt-0.5">{entries.length}</p>
              </div>
              <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase">Daytona Sandbox</span>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">Isolated</p>
              </div>
            </div>

            {session.merkleRoot && (
              <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 font-mono text-xs">
                <span className="text-[10px] text-zinc-500 uppercase block mb-1">Merkle Proof Root</span>
                <p className="text-indigo-400 font-bold break-all">{session.merkleRoot}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
