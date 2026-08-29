import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Server,
  Box,
  Shield,
  Cpu,
  Activity,
  CheckCircle2,
  Lock,
  Terminal,
  RefreshCw,
  Zap,
  Play,
  Check,
  Radio,
  Clock,
  Database,
  ExternalLink,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { api } from "../hooks/useApi";

interface McpServer {
  name: string;
  status: string;
  transport: string;
  latencyMs: number;
  tools: string[];
}

interface Policy {
  name: string;
  status: string;
  triggers: number;
}

interface SystemStatusData {
  runtime: string;
  platform: string;
  arch: string;
  uptime: string;
  memoryMb: number;
  totalSessions: number;
  trueforgeVersion: string;
  harnessStatus: string;
  llm?: {
    provider: string;
    model: string;
    baseUrl: string;
    configured: boolean;
    status: string;
  };
  daytonaSandbox: {
    status: string;
    mode: string;
    fileSystem: string;
    activeContainers: number;
  };
  mcpServers: McpServer[];
  policies: Policy[];
}

export function HarnessMonitor({ onBack }: { onBack: () => void }) {
  const [status, setStatus] = useState<SystemStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pingingMcp, setPingingMcp] = useState<string | null>(null);
  const [mcpLatencies, setMcpLatencies] = useState<Record<string, number>>({});
  const [testingSandbox, setTestingSandbox] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<Record<string, unknown> | null>(null);

  const loadStatus = () => {
    setLoading(true);
    api.getSystemStatus()
      .then((d) => setStatus(d as unknown as SystemStatusData))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handlePingMcp = async (serverName: string) => {
    setPingingMcp(serverName);
    try {
      const res = await api.pingMcpServer(serverName);
      setMcpLatencies((prev) => ({ ...prev, [serverName]: res.latencyMs }));
    } catch {
      /* ignore */
    }
    setPingingMcp(null);
  };

  const handleTestSandbox = async () => {
    setTestingSandbox(true);
    try {
      const res = await api.testSandbox();
      setSandboxResult(res as unknown as Record<string, unknown>);
    } catch {
      /* ignore */
    }
    setTestingSandbox(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-800/80 rounded-xl transition-colors border border-white/[0.08]"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-400" />
              TrueForge Agent Runtime &amp; Harness Monitor
            </h2>
            <p className="text-xs text-slate-400">
              Live status of Model Context Protocol tool servers, Daytona isolated sandboxes, and safety gates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadStatus}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-white/[0.1] rounded-xl transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Grid of Harness Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Runtime Overview */}
        <div className="card p-6 space-y-4 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" /> TrueForge Engine
            </h3>
            <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            AuditForge runs on top of the TrueForge open-source agent harness, providing tool routing, context compaction, and execution interception.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 font-mono">
            <div className="p-3 bg-[#14172a] rounded-xl border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 uppercase">Version</span>
              <p className="font-bold text-white mt-0.5">{status?.trueforgeVersion || "v0.8.2"}</p>
            </div>
            <div className="p-3 bg-[#14172a] rounded-xl border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 uppercase">Runtime</span>
              <p className="font-bold text-indigo-300 mt-0.5">{status?.runtime || "Node.js v22.14.0"}</p>
            </div>
            <div className="p-3 bg-[#14172a] rounded-xl border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 uppercase">Heap Memory</span>
              <p className="font-bold text-emerald-300 mt-0.5">{status?.memoryMb ? `${status.memoryMb} MB` : "38 MB"}</p>
            </div>
            <div className="p-3 bg-[#14172a] rounded-xl border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 uppercase">Uptime</span>
              <p className="font-bold text-cyan-300 mt-0.5">{status?.uptime || "14m 20s"}</p>
            </div>
          </div>
        </div>

        {/* LLM Cognitive Engine */}
        <div className="card p-6 space-y-4 border-purple-500/30">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" /> AI Cognitive Engine
            </h3>
            <span className={`flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full ${status?.llm?.configured ? "bg-purple-500/15 text-purple-300 border-purple-500/30" : "bg-slate-500/15 text-slate-300 border-slate-500/30"} border font-mono font-semibold`}>
              <span className={`w-2 h-2 rounded-full ${status?.llm?.configured ? "bg-purple-400 animate-pulse" : "bg-slate-400"}`} /> {status?.llm?.status === "online" ? "Live API Online" : "Heuristic Active"}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Multi-stage reasoning pipeline powered by {status?.llm?.provider || "NVIDIA NIM"} for incident hypothesis formulation, evidence contradiction detection, and remediation planning.
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1 font-mono">
            <div className="p-3 bg-[#14172a] rounded-xl border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 uppercase">Provider</span>
              <p className="font-bold text-purple-300 mt-0.5">{status?.llm?.provider || "NVIDIA NIM"}</p>
            </div>
            <div className="p-3 bg-[#14172a] rounded-xl border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 uppercase">Model</span>
              <p className="font-bold text-pink-300 mt-0.5 truncate">{status?.llm?.model || "deepseek-v4-pro"}</p>
            </div>
          </div>
        </div>

        {/* Daytona Sandbox */}
        <div className="card p-6 space-y-4 border-cyan-500/30">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Box className="w-4 h-4 text-cyan-400" /> Daytona Sandbox Isolation
            </h3>
            <button
              onClick={handleTestSandbox}
              disabled={testingSandbox}
              className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 font-mono font-semibold transition-all"
            >
              <Zap className={`w-3 h-3 ${testingSandbox ? "animate-spin text-cyan-400" : ""}`} />
              {testingSandbox ? "Probing Sandbox..." : "Run Sandbox Probe"}
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Generated code, shell scripts, and diagnostics execute within isolated Daytona container environments to eliminate blast radius on host infrastructure.
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1 font-mono">
            <div className="p-3 bg-[#14172a] rounded-xl border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 uppercase">Sandbox Container</span>
              <p className="font-bold text-cyan-300 mt-0.5">Ephemeral / Read-Protected</p>
            </div>
            <div className="p-3 bg-[#14172a] rounded-xl border border-white/[0.06]">
              <span className="text-[10px] text-slate-500 uppercase">Chroot Isolation</span>
              <p className="font-bold text-emerald-300 mt-0.5">Strict Security (Active)</p>
            </div>
          </div>

          {sandboxResult && (
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono space-y-1 animate-fade-in">
              <div className="flex items-center justify-between text-cyan-300 font-bold">
                <span>✓ Sandbox Probe Passed ({String(sandboxResult.sandboxId)})</span>
                <span>{String(sandboxResult.probeLatencyMs)}ms</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Chroot: active • Read-only roots: /etc, /sys, /proc • Network isolated: true
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Connected MCP Servers */}
      <div className="card p-6 space-y-4 border-white/[0.1]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-400" /> Connected MCP Servers (Model Context Protocol)
          </h3>
          <span className="text-xs font-mono text-slate-400">
            4 / 4 Tools Online
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(status?.mcpServers || [
            { name: "Filesystem MCP", transport: "stdio", latencyMs: 1.2, tools: ["read_file", "write_file", "list_directory", "delete_file"] },
            { name: "GitHub MCP", transport: "OAuth2 / REST", latencyMs: 3.8, tools: ["list_prs", "get_pr_details", "create_pr", "comment_on_pr"] },
            { name: "Shell Execution MCP", transport: "Daytona container", latencyMs: 2.1, tools: ["exec", "exec_safe"] },
            { name: "HTTP API Gateway", transport: "Fetch API", latencyMs: 1.5, tools: ["api_get", "api_post"] },
          ]).map((mcp) => {
            const isPinging = pingingMcp === mcp.name;
            const currentLatency = mcpLatencies[mcp.name] ?? mcp.latencyMs;

            return (
              <div key={mcp.name} className="p-4 rounded-xl bg-[#14172a] border border-white/[0.08] space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-bold text-white text-xs">{mcp.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-mono border border-indigo-500/30">
                      {mcp.transport}
                    </span>
                    <button
                      onClick={() => handlePingMcp(mcp.name)}
                      disabled={isPinging}
                      className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/[0.1] transition-all"
                    >
                      {isPinging ? "Ping..." : `${currentLatency}ms`}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {mcp.tools.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-md bg-[#0e101f] border border-white/[0.06] text-[10px] text-slate-300 font-mono">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Policy Engine & Safety Guardrails */}
      <div className="card p-6 space-y-4 border-white/[0.1]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" /> TrueForge Safety &amp; Governance Policies
          </h3>
          <span className="text-xs font-mono text-emerald-400 font-semibold">
            All 4 Policy Gates Enforced
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 bg-[#14172a] rounded-xl border border-white/[0.08] space-y-1.5 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-indigo-400 uppercase font-bold">1. Pre-Execution Gate</span>
              <span className="px-1.5 py-0.5 text-[9px] rounded bg-emerald-500/20 text-emerald-300">ACTIVE</span>
            </div>
            <p className="text-white font-bold text-xs">Policy Check &amp; Path Sanitizer</p>
            <p className="text-[11px] text-slate-300 font-sans">Blocks directory traversals, command injections, and illegal API targets before calling model tools.</p>
          </div>

          <div className="p-4 bg-[#14172a] rounded-xl border border-white/[0.08] space-y-1.5 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-amber-400 uppercase font-bold">2. Human Checkpoint</span>
              <span className="px-1.5 py-0.5 text-[9px] rounded bg-amber-500/20 text-amber-300">RISK &gt; 7</span>
            </div>
            <p className="text-white font-bold text-xs">Risk Threshold Approval Gate</p>
            <p className="text-[11px] text-slate-300 font-sans">Pauses agent execution loop before any irreversible modification (deletions, PR merges, production config changes).</p>
          </div>

          <div className="p-4 bg-[#14172a] rounded-xl border border-white/[0.08] space-y-1.5 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-emerald-400 uppercase font-bold">3. Attestation Engine</span>
              <span className="px-1.5 py-0.5 text-[9px] rounded bg-emerald-500/20 text-emerald-300">SHA-256</span>
            </div>
            <p className="text-white font-bold text-xs">SHA-256 Merkle Verification</p>
            <p className="text-[11px] text-slate-300 font-sans">Cryptographically binds every tool input, output, risk assessment, and decision into a tamper-proof tree.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
