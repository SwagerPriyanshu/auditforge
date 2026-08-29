import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Flame,
  Key,
  GitPullRequest,
  Trash2,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  Lock,
  Search,
  ArrowRight,
  Sparkles,
  Layers,
  Database,
  Clock,
  Plus,
  Cpu,
  Server,
  Zap,
} from "lucide-react";
import { api } from "../hooks/useApi";
import { StatusBadge } from "../components/StatusBadge";
import { SpotlightCard } from "../components/SpotlightCard";
import { MerkleGraph } from "../components/MerkleGraph";
import type { Session } from "../types";

export function HomePage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadingPreset, setLoadingPreset] = useState<string | null>(null);

  const loadSessions = async () => {
    try {
      const data = await api.getSessions();
      setSessions(data.sessions as unknown as Session[]);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleRunPreset = async (presetKey: string) => {
    setLoadingPreset(presetKey);
    try {
      const session = (await api.runPreset(presetKey)) as unknown as Session;
      navigate(`/investigations/${session.id}`);
    } catch { /* ignore */ }
    setLoadingPreset(null);
  };

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.incident.toLowerCase().includes(search.toLowerCase()) ||
      (s.model && s.model.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const completedCount = sessions.filter((s) => s.status === "completed").length;
  const awaitingCount = sessions.filter((s) => s.status === "awaiting_approval").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              Incident Investigation Command Center
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" /> TrueForge v0.8.2
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Governed autonomous incident triage with MCP tool auditing, Daytona sandboxing, and SHA-256 Merkle proofs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/harness"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900/90 hover:bg-slate-800 border border-white/[0.08] transition-all shadow-sm"
          >
            <Server className="w-3.5 h-3.5 text-indigo-400" />
            Harness Monitor
          </Link>
          <button
            onClick={() => handleRunPreset("connection_pool")}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-950/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Quick Run Demo
          </button>
        </div>
      </div>

      {/* 4 Clean Preset Action Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> 1-Click Verification Scenarios
          </span>
          <span className="text-[11px] text-slate-500 font-mono">Select scenario to execute agent loop</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[
            {
              key: "connection_pool",
              tag: "INCIDENT TRIAGE",
              title: "500 Connection Starvation",
              desc: "DB pool exhaustion triage, config drift diagnosis, and audited rollback",
              icon: Flame,
              accent: "border-amber-500/30 hover:border-amber-500/60 bg-amber-500/[0.03]",
              btnColor: "text-amber-300 group-hover:text-amber-200",
              tagColor: "text-amber-300 bg-amber-500/10 border-amber-500/20",
            },
            {
              key: "secret_leak",
              tag: "SECURITY GOVERNANCE",
              title: "AWS Secret Exposure",
              desc: "Scans unmasked API credentials in commit history & staging config files",
              icon: Key,
              accent: "border-rose-500/30 hover:border-rose-500/60 bg-rose-500/[0.03]",
              btnColor: "text-rose-300 group-hover:text-rose-200",
              tagColor: "text-rose-300 bg-rose-500/10 border-rose-500/20",
            },
            {
              key: "pr_flaky",
              tag: "CI/CD REMEDIATION",
              title: "Flaky PR #42 Failure",
              desc: "Triages integration test timeouts, crafts code patch & opens PR comment",
              icon: GitPullRequest,
              accent: "border-indigo-500/30 hover:border-indigo-500/60 bg-indigo-500/[0.03]",
              btnColor: "text-indigo-300 group-hover:text-indigo-200",
              tagColor: "text-indigo-300 bg-indigo-500/10 border-indigo-500/20",
            },
            {
              key: "dangerous_deletion",
              tag: "HUMAN CHECKPOINT",
              title: "Critical Deletion Gate",
              desc: "Risk 9/10 system purge pauses the harness and awaits human sign-off",
              icon: Trash2,
              accent: "border-orange-500/30 hover:border-orange-500/60 bg-orange-500/[0.03]",
              btnColor: "text-orange-300 group-hover:text-orange-200",
              tagColor: "text-orange-300 bg-orange-500/10 border-orange-500/20",
              glow: "rgba(249, 115, 22, 0.15)",
            },
          ].map((preset) => {
            const Icon = preset.icon;
            const isLoading = loadingPreset === preset.key;
            return (
              <SpotlightCard
                key={preset.key}
                onClick={() => handleRunPreset(preset.key)}
                spotlightColor={preset.glow || "rgba(99, 102, 241, 0.15)"}
                className={`p-4 transition-all duration-200 cursor-pointer ${preset.accent} hover:bg-slate-800/40 flex flex-col justify-between group rounded-xl`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border font-semibold ${preset.tagColor}`}>
                      {preset.tag}
                    </span>
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-indigo-200 transition-colors">{preset.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{preset.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <span className={`text-xs font-semibold flex items-center gap-1.5 ${preset.btnColor}`}>
                    {isLoading ? (
                      <>
                        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        Run Scenario
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">TrueForge MCP</span>
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      </div>

      {/* Metrics Overview Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="card p-4 rounded-xl border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Investigations</span>
            <Activity className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{sessions.length}</p>
          <span className="text-[11px] text-slate-500">Persisted in SQLite</span>
        </div>

        <div className="card p-4 rounded-xl border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Pending Human Gates</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-300 font-mono">{awaitingCount}</p>
          <span className="text-[11px] text-slate-500">Requires reviewer sign-off</span>
        </div>

        <div className="card p-4 rounded-xl border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Attested & Verified</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-300 font-mono">{completedCount}</p>
          <span className="text-[11px] text-slate-500">SHA-256 Merkle Proven</span>
        </div>

        <div className="card p-4 rounded-xl border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Runtime Sandbox</span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-indigo-300 font-mono">Daytona Isolated</p>
          <span className="text-[11px] text-slate-500">Zero host blast radius</span>
        </div>
      </div>

      {/* Incident Explorer Table */}
      <div className="card rounded-2xl border border-white/[0.08] overflow-hidden shadow-xl">
        {/* Table Filter Bar */}
        <div className="p-4 border-b border-white/[0.06] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/40">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search incidents by keyword, service, error..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900/90 border border-white/[0.1] rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-900/90 border border-white/[0.1] rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50 font-mono cursor-pointer"
            >
              <option value="all">All Statuses ({sessions.length})</option>
              <option value="completed">Completed & Attested ({completedCount})</option>
              <option value="awaiting_approval">Awaiting Human Gate ({awaitingCount})</option>
              <option value="planning">In Progress</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/70 border-b border-white/[0.06] text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Incident Description</th>
                <th className="py-3 px-4">Reasoning Model</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 space-y-2">
                    <p className="text-sm font-semibold text-slate-400">No investigations matching query</p>
                    <p className="text-xs text-slate-600">Launch a scenario above to start a new investigation.</p>
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={session.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/investigations/${session.id}`}
                        className="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors block truncate max-w-md"
                      >
                        {session.title}
                      </Link>
                      <p className="text-[11px] text-slate-400 truncate max-w-md mt-0.5">{session.incident}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap text-[11px]">{session.model}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                      {new Date(session.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/investigations/${session.id}`}
                          className="px-2.5 py-1 bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 rounded-lg text-[11px] font-semibold hover:bg-indigo-600/25 transition-colors"
                        >
                          Studio
                        </Link>
                        <Link
                          to={`/audit/${session.id}`}
                          className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-white/[0.08] rounded-lg text-[11px] transition-colors"
                        >
                          Audit
                        </Link>
                        <Link
                          to={`/attestation/${session.id}`}
                          className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/20 rounded-lg text-[11px] transition-colors"
                        >
                          Proof
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
