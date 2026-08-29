import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Shield,
  Activity,
  Database,
  PlayCircle,
  Layers,
  Lock,
  Server,
  Plus,
  Radio,
  ChevronRight,
  Flame,
  Key,
  GitPullRequest,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { api } from "../hooks/useApi";
import { AuditForgeLogo } from "../components/AuditForgeLogo";
import type { Session } from "../types";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [title, setTitle] = useState("");
  const [incident, setIncident] = useState("");
  const [model, setModel] = useState("gpt-4o");
  const [creating, setCreating] = useState(false);
  const [presetLoading, setPresetLoading] = useState<string | null>(null);

  const loadSessions = async () => {
    try {
      const data = await api.getSessions();
      setSessions(data.sessions as unknown as Session[]);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    loadSessions();
  }, [location.pathname]);

  const handleCreate = async () => {
    if (!title.trim() || !incident.trim()) return;
    setCreating(true);
    try {
      const session = (await api.createSession({
        title: title.trim(),
        incident: incident.trim(),
        model,
      })) as unknown as Session;
      setShowNewModal(false);
      setTitle("");
      setIncident("");
      await api.investigate(session.id);
      navigate(`/investigations/${session.id}`);
    } catch { /* ignore */ }
    setCreating(false);
  };

  const handleRunPreset = async (presetKey: string) => {
    setPresetLoading(presetKey);
    try {
      const session = (await api.runPreset(presetKey)) as unknown as Session;
      navigate(`/investigations/${session.id}`);
    } catch { /* ignore */ }
    setPresetLoading(null);
  };

  // Determine active session ID from route
  const currentSessionId = location.pathname.split("/")[2] || sessions[0]?.id;

  const NAV_ITEMS = [
    { label: "Command Center", path: "/", icon: Activity },
    { label: "Live Investigation", path: currentSessionId ? `/investigations/${currentSessionId}` : "/", icon: Radio },
    { label: "Audit Ledger", path: currentSessionId ? `/audit/${currentSessionId}` : "/audit", icon: Database },
    { label: "Time-Machine Replay", path: currentSessionId ? `/replay/${currentSessionId}` : "/replay", icon: PlayCircle },
    { label: "Evidence Matrix", path: currentSessionId ? `/evidence/${currentSessionId}` : "/evidence", icon: Layers },
    { label: "Cryptographic Proof", path: currentSessionId ? `/attestation/${currentSessionId}` : "/attestation", icon: Lock },
    { label: "TrueForge Harness", path: "/harness", icon: Server },
  ];

  return (
    <div className="min-h-screen flex bg-[#09090b] text-zinc-100 antialiased font-sans">
      {/* Left Sidebar */}
      <aside className="w-64 shrink-0 bg-[#0d0d10] border-r border-zinc-800/80 flex flex-col justify-between hidden md:flex">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group">
              <AuditForgeLogo size={28} />
            </Link>
          </div>

          {/* New Incident Trigger Button */}
          <div className="p-3">
            <button
              onClick={() => setShowNewModal(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> New Investigation
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.path.split("/")[1] ? `/${item.path.split("/")[1]}` : item.path);

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-zinc-800/90 text-zinc-100 font-semibold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-zinc-500"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Demo Presets In Sidebar */}
          <div className="px-3 pt-4">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 px-3 block mb-1.5">
              1-Click Demo Scenarios
            </span>
            <div className="space-y-1">
              {[
                { key: "connection_pool", label: "500 Pool Crash", icon: Flame, color: "text-amber-400" },
                { key: "secret_leak", label: "AWS Key Leak", icon: Key, color: "text-rose-400" },
                { key: "pr_flaky", label: "PR #42 Failure", icon: GitPullRequest, color: "text-indigo-400" },
                { key: "dangerous_deletion", label: "Risk 9/10 Gate", icon: Trash2, color: "text-orange-400" },
              ].map((p) => {
                const Icon = p.icon;
                const isLoading = presetLoading === p.key;
                return (
                  <button
                    key={p.key}
                    onClick={() => handleRunPreset(p.key)}
                    disabled={Boolean(presetLoading)}
                    className="w-full text-left flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Icon className={`w-3.5 h-3.5 ${p.color}`} />
                      <span className="truncate">{p.label}</span>
                    </div>
                    <span className="text-[10px] text-zinc-600 font-mono">{isLoading ? "..." : "Run"}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Sessions Feed */}
          <div className="flex-1 px-3 pt-4 overflow-y-auto min-h-0">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 px-3 block mb-1.5">
              Recent Investigations
            </span>
            <div className="space-y-1">
              {sessions.slice(0, 8).map((s) => (
                <Link
                  key={s.id}
                  to={`/investigations/${s.id}`}
                  className={`block px-3 py-2 rounded-lg text-xs transition-colors truncate ${
                    location.pathname.includes(s.id)
                      ? "bg-zinc-800/80 text-zinc-100 border border-zinc-700/60"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="truncate font-medium">{s.title}</span>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      s.status === "completed" ? "bg-emerald-400" : s.status === "awaiting_approval" ? "bg-amber-400 animate-ping" : "bg-indigo-400"
                    }`} />
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono block truncate">
                    {new Date(s.createdAt).toLocaleTimeString()} • {s.model}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-zinc-800/80 text-[11px] text-zinc-500 font-mono flex items-center justify-between">
          <span>Daytona Sandbox</span>
          <span className="text-emerald-400">ISOLATED</span>
        </div>
      </aside>

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-14 bg-[#0d0d10] border-b border-zinc-800/80 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Link to="/" className="hover:text-zinc-200 font-medium">AuditForge</Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-zinc-200 font-semibold">
              {location.pathname === "/"
                ? "Incident Command Center"
                : location.pathname.startsWith("/investigations")
                ? "Live Investigation Studio"
                : location.pathname.startsWith("/audit")
                ? "Cryptographic Audit Ledger"
                : location.pathname.startsWith("/replay")
                ? "Investigation Replay"
                : location.pathname.startsWith("/evidence")
                ? "Evidence & Hypotheses Matrix"
                : location.pathname.startsWith("/attestation")
                ? "Attestation Certificate"
                : "TrueForge Runtime Monitor"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-md text-[11px] font-mono text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>SSE Stream: Active</span>
            </div>

            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-md transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Launch
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* New Incident Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121215] border border-zinc-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" /> Start New Incident Investigation
              </h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-zinc-500 hover:text-zinc-300 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Incident Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Memory Spike in Production Auth Service"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Incident Description & Context</label>
                <textarea
                  value={incident}
                  onChange={(e) => setIncident(e.target.value)}
                  placeholder="Describe the symptoms, error logs, and affected components..."
                  rows={4}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Reasoning Model Provider</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="gpt-4o">OpenAI GPT-4o</option>
                  <option value="claude-3.5-sonnet">Anthropic Claude 3.5 Sonnet</option>
                  <option value="gemini-2.0-flash">Google Gemini 2.0 Flash</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !title.trim() || !incident.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-40"
              >
                {creating ? "Launching Agent..." : "Start Investigation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
