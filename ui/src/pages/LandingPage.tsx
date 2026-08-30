import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  Lock,
  Play,
  ArrowRight,
  Sparkles,
  Layers,
  Terminal,
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Flame,
  Key,
  GitPullRequest,
  Trash2,
  Box,
  Database,
  ExternalLink,
  ChevronRight,
  Check,
  Award,
  RefreshCw,
  Code2,
  Fingerprint,
  Eye,
  FileCheck2,
  Compass,
  Gauge,
  Sliders,
  Share2,
  Workflow,
  Server,
  Binary,
  CheckCheck,
  Radio,
  FileCode,
  Search,
} from "lucide-react";
import { api } from "../hooks/useApi";
import { AuditForgeLogo } from "../components/AuditForgeLogo";

export function LandingPage() {
  const navigate = useNavigate();
  const [activeArchTab, setActiveArchTab] = useState<"pipeline" | "phases" | "specs">("pipeline");
  const [loadingPreset, setLoadingPreset] = useState<string | null>(null);

  const handleRunPreset = async (presetKey: string) => {
    setLoadingPreset(presetKey);
    try {
      const session = (await api.runPreset(presetKey)) as unknown as { id: string };
      navigate(`/investigations/${session.id}`);
    } catch {
      navigate("/app");
    }
    setLoadingPreset(null);
  };

  return (
    <div className="min-h-screen text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Floating Glass Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#090a14]/90 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <AuditForgeLogo size={32} />
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold hidden sm:inline-block">
              TrueForge Runtime
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-xs text-slate-300 font-medium">
            <a href="#features" className="hover:text-white transition-colors">Key Features</a>
            <a href="#architecture" className="hover:text-white transition-colors text-indigo-400 font-bold">Architecture</a>
            <a href="#demo-scenarios" className="hover:text-white transition-colors">1-Click Demos</a>
            <a href="#comparison" className="hover:text-white transition-colors">Comparison</a>
            <Link to="/harness" className="hover:text-white transition-colors">Runtime Monitor</Link>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/SwagerPriyanshu/auditforge"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" /> GitHub
            </a>

            <Link
              to="/app"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-950/60 ring-1 ring-white/20 transition-all hover:scale-105"
            >
              Launch Command Center <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-10 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-4 relative">
          {/* Hackathon Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-cyan-500/15 border border-indigo-500/30 text-xs text-indigo-200 font-medium shadow-md shadow-indigo-950/40 animate-fade-in backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Built for the <strong>Agent Harness Hackathon 2026</strong></span>
            <span className="text-indigo-400/50">•</span>
            <span className="text-emerald-300 font-bold">Track 1, 2 &amp; 3 Submission</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-[1.1] drop-shadow-sm">
            Verifiable Incident Investigation.{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
              Governed by TrueForge.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            An autonomous cybersecurity and DevOps incident triage agent that reaches real MCP tools, executes code in isolated Daytona sandboxes, pauses for human approval before dangerous commands, and cryptographically proves every action with SHA-256 Merkle trees.
          </p>

          {/* Hero Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <Link
              to="/app"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-950/80 ring-1 ring-white/20 transition-all hover:scale-105"
            >
              Open Incident Command Center <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#demo-scenarios"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900/90 hover:bg-slate-800/90 text-slate-200 border border-white/[0.12] rounded-xl text-xs sm:text-sm font-semibold transition-all backdrop-blur-md shadow-md"
            >
              <Play className="w-4 h-4 text-emerald-400" /> Explore 1-Click Judge Demos
            </a>
          </div>

          {/* Trust & Architecture Badges */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/60 border border-white/[0.08]">
              <Check className="w-3 h-3 text-emerald-400" /> TrueForge Agent Harness
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/60 border border-white/[0.08]">
              <Check className="w-3 h-3 text-emerald-400" /> Daytona Sandbox Isolation
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/60 border border-white/[0.08]">
              <Check className="w-3 h-3 text-emerald-400" /> Zero-Trust Human Gate
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/60 border border-white/[0.08]">
              <Check className="w-3 h-3 text-emerald-400" /> SHA-256 Merkle Proofs
            </span>
          </div>
        </div>

        {/* Interactive Live Hero Terminal Mockup */}
        <div className="max-w-4xl mx-auto mt-8 rounded-2xl border border-white/[0.12] bg-[#121424]/90 shadow-2xl overflow-hidden backdrop-blur-2xl ring-1 ring-white/10">
          {/* Terminal Window Header */}
          <div className="px-4 py-3 bg-[#17192f] border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 shadow-sm shadow-rose-900/50" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 shadow-sm shadow-amber-900/50" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-sm shadow-emerald-900/50" />
              </div>
              <span className="text-xs text-slate-400 font-mono ml-2 font-medium">
                auditforge-agent-runtime — session: live-triage-42
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono text-emerald-300 font-semibold">SSE Event Stream: Active</span>
            </div>
          </div>

          {/* Terminal Mockup Content */}
          <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 font-mono text-xs">
            {/* Left Log Timeline */}
            <div className="lg:col-span-7 space-y-3">
              <div className="p-3.5 rounded-xl bg-[#181b30] border border-white/[0.08] space-y-1 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span className="text-indigo-400 font-bold">11:55:01 UTC • AGENT PLANNING</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">PHASE 1/8</span>
                </div>
                <p className="text-slate-200">
                  Identified 500 Connection Starvation on PostgreSQL pool. Formulating evidence gathering plan...
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#181b30] border border-white/[0.08] space-y-1 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span className="text-teal-400 font-bold">11:55:04 UTC • TOOL INTERCEPTED</span>
                  <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-semibold">Risk: 3/10 (Safe)</span>
                </div>
                <p className="text-slate-200">
                  <span className="text-slate-500">$</span> read_file({`path: "/etc/pgbouncer/pgbouncer.ini"`})
                </p>
                <p className="text-[11px] text-slate-400">
                  Result: pool_size=20, max_client_conn=100 (Exhausted)
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 space-y-2 shadow-md">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-rose-400 font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> 11:55:08 UTC • HIGH RISK INTERCEPTED
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/25 text-rose-300 font-bold">Risk: 9/10 (Critical)</span>
                </div>
                <p className="text-slate-100">
                  <span className="text-slate-400">$</span> execute_code({`cmd: "rm -rf /var/log/app/* && systemctl restart app"`})
                </p>
                <div className="p-2.5 bg-[#0e101f] rounded-lg border border-rose-500/30 text-[11px] text-amber-300">
                  ⚠️ <strong>Harness Checkpoint:</strong> Action exceeds risk threshold (&gt;7). Agent loop paused. Awaiting human authorization.
                </div>
              </div>
            </div>

            {/* Right Human Approval Gate Simulation */}
            <div className="lg:col-span-5 space-y-3">
              <div className="p-4 rounded-xl bg-gradient-to-b from-[#1c2038] to-[#121528] border border-amber-500/40 space-y-3 shadow-lg">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-amber-400" /> Human Approval Gate
                  </span>
                  <span className="text-[10px] font-bold text-amber-300 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40">
                    BLOCKED
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <span className="text-slate-400 uppercase text-[9px] font-semibold">Blast Radius Assessment</span>
                  <p className="text-slate-200">
                    Command performs recursive deletion in production file system.
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                    <div className="p-2 rounded-lg bg-[#0e101f] border border-white/[0.08]">
                      <span className="text-slate-400">Worst Case</span>
                      <p className="text-rose-400 font-semibold">Audit log data loss</p>
                    </div>
                    <div className="p-2 rounded-lg bg-[#0e101f] border border-white/[0.08]">
                      <span className="text-slate-400">Safe Alternative</span>
                      <p className="text-emerald-400 font-semibold">logrotate &amp; restart</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleRunPreset("dangerous_deletion")}
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-md shadow-emerald-950/50 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" /> Authorize Live ➔
                    </button>
                    <button
                      onClick={() => handleRunPreset("connection_pool")}
                      className="py-2.5 bg-rose-600/80 hover:bg-rose-600 text-white font-bold rounded-lg text-xs shadow-md shadow-rose-950/50 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Deny &amp; Abort
                    </button>
                  </div>
                  <Link
                    to="/app"
                    className="py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold transition-colors border border-white/[0.06] text-center"
                  >
                    Open Live Studio
                  </Link>
                </div>
              </div>

              {/* Cryptographic Hash Seal Preview */}
              <div className="p-3.5 rounded-xl bg-[#181b30] border border-cyan-500/30 text-[11px] space-y-1 shadow-md">
                <span className="text-slate-400 uppercase text-[9px] font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3 text-cyan-400" /> SHA-256 Merkle Proof Chain
                </span>
                <p className="text-cyan-300 break-all font-bold text-[10px]">
                  0xb404b2ce52b5dba84f88e72ef6d967e8...
                </p>
                <span className="text-emerald-400 text-[9px] font-bold block pt-0.5">
                  ✓ 100% Cryptographically Attested
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 1-Click Judge Demo Scenarios Deck */}
      <section id="demo-scenarios" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-t border-white/[0.08] bg-[#0e101f]/70">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-bold flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" /> 1-Click Interactive Evaluation
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Test the Agent Across 4 Real-World Incidents
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Click any pre-configured scenario below to launch an autonomous TrueForge investigation session right now:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[
              {
                key: "connection_pool",
                tag: "INCIDENT TRIAGE",
                title: "500 Connection Starvation",
                desc: "Diagnoses DB pool exhaustion, verifies Postgres telemetry, applies config fix",
                icon: Flame,
                color: "text-amber-400",
                badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
              },
              {
                key: "secret_leak",
                tag: "SECURITY GOVERNANCE",
                title: "AWS Secret Exposure",
                desc: "Detects unmasked credentials in commit history & staging config, alerts reviewer",
                icon: Key,
                color: "text-rose-400",
                badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
              },
              {
                key: "pr_flaky",
                tag: "CI/CD REMEDIATION",
                title: "Flaky PR #42 Failure",
                desc: "Triages checkout test timeouts, crafts fix PR patch, comments on review trail",
                icon: GitPullRequest,
                color: "text-indigo-400",
                badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
              },
              {
                key: "dangerous_deletion",
                tag: "HUMAN CHECKPOINT",
                title: "Critical Deletion Gate",
                desc: "Risk 9/10 command attempt pauses the harness and awaits Human Approval",
                icon: Trash2,
                color: "text-orange-400",
                badge: "bg-orange-500/20 text-orange-300 border-orange-500/40",
              },
            ].map((p) => {
              const Icon = p.icon;
              const isLoading = loadingPreset === p.key;
              return (
                <div
                  key={p.key}
                  onClick={() => handleRunPreset(p.key)}
                  className="card-hover p-4 sm:p-5 cursor-pointer flex flex-col justify-between group shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${p.badge}`}>
                        {p.tag}
                      </span>
                      <Icon className={`w-4 h-4 ${p.color}`} />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 mb-1 transition-colors">
                      {p.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-white/[0.08] flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1">
                      {isLoading ? "Starting Agent..." : "Run Scenario ➔"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">TrueForge MCP</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* NEW: Comprehensive TrueForge Architecture Deep-Dive Section (#architecture) */}
      <section id="architecture" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-t border-white/[0.08] bg-[#0c0d1a]/95">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-2 max-w-3xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold flex items-center justify-center gap-2">
              <Workflow className="w-4 h-4 text-cyan-400" /> TrueForge Runtime Architecture
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              The Engine Behind Autonomous, Verifiable Governance
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              AuditForge sits on top of the TrueForge open-source harness to intercept, isolate, govern, and cryptographically attest every single agent action.
            </p>
          </div>

          {/* Architecture Switcher Tabs */}
          <div className="flex justify-center">
            <div className="p-1.5 rounded-2xl bg-[#14172a] border border-white/[0.08] flex items-center gap-2 shadow-inner">
              <button
                onClick={() => setActiveArchTab("pipeline")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeArchTab === "pipeline"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/60"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Layers className="w-4 h-4" /> Runtime Interception Pipeline
              </button>

              <button
                onClick={() => setActiveArchTab("phases")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeArchTab === "phases"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/60"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Compass className="w-4 h-4" /> 8-Phase Investigation Protocol
              </button>

              <button
                onClick={() => setActiveArchTab("specs")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeArchTab === "specs"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/60"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Gauge className="w-4 h-4" /> Benchmarks &amp; System Specs
              </button>
            </div>
          </div>

          {/* Tab 1: Runtime Interception Pipeline */}
          {activeArchTab === "pipeline" && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  {
                    step: "01",
                    title: "Model Intent",
                    desc: "LLM requests tool invocation (e.g. read_file, execute_code, create_pr)",
                    icon: Cpu,
                    color: "text-indigo-400",
                    border: "border-indigo-500/30",
                  },
                  {
                    step: "02",
                    title: "Pre-Execution & Risk",
                    desc: "Policy verification, path sanitization, and real-time risk scoring (1-10)",
                    icon: Sliders,
                    color: "text-cyan-400",
                    border: "border-cyan-500/30",
                  },
                  {
                    step: "03",
                    title: "Human Gate & Sandbox",
                    desc: "High risk (>7) halts for approval. Safe code executes in isolated Daytona container",
                    icon: Shield,
                    color: "text-amber-400",
                    border: "border-amber-500/30",
                  },
                  {
                    step: "04",
                    title: "SHA-256 Merkle Proof",
                    desc: "Post-execution verification & binary Merkle root computed for immutable proof",
                    icon: Lock,
                    color: "text-emerald-400",
                    border: "border-emerald-500/30",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.step} className={`card p-6 space-y-3 ${item.border} shadow-lg`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-500">STAGE {item.step}</span>
                        <Icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <h3 className="text-base font-bold text-white">{item.title}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Detailed Interceptor Visual Matrix */}
              <div className="card p-8 space-y-6 border-white/[0.1]">
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Binary className="w-5 h-5 text-indigo-400" />
                      TrueForge Interceptor Execution Flow
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Every tool call passes through synchronous verification hooks before host or container execution:
                    </p>
                  </div>
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Policy Engine: ACTIVE
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs font-mono">
                  <div className="p-4 rounded-xl bg-[#14172a] border border-white/[0.06] space-y-2">
                    <span className="text-indigo-400 font-bold uppercase text-[10px]">1. PRE-EXECUTION HOOK</span>
                    <p className="text-slate-200">
                      • Policy compliance check<br />
                      • Path traversal block (/etc/passwd, .env)<br />
                      • Sensitive command regex detection
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#14172a] border border-white/[0.06] space-y-2">
                    <span className="text-amber-400 font-bold uppercase text-[10px]">2. DYNAMIC RISK ENGINE</span>
                    <p className="text-slate-200">
                      • Calculates risk score (1-10)<br />
                      • Worst-case blast radius assessment<br />
                      • Pauses for human decision if score &gt; 7
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#14172a] border border-white/[0.06] space-y-2">
                    <span className="text-emerald-400 font-bold uppercase text-[10px]">3. MERKLE ATTESTATION</span>
                    <p className="text-slate-200">
                      • Post-execution sensitive data scan<br />
                      • Computes leaf hash: SHA-256(input + output)<br />
                      • Updates session Merkle root of trust
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: 8-Phase Investigation Protocol */}
          {activeArchTab === "phases" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
              {[
                { phase: 1, name: "Plan & Scope", desc: "Ingests incident symptoms, logs, and initial crash reports to build execution DAG", icon: Search },
                { phase: 2, name: "Gather Evidence", desc: "Invokes MCP read_file, search_files, and list_commits to assemble facts", icon: Database },
                { phase: 3, name: "Form Hypotheses", desc: "Generates ranked failure vectors (regression, config drift, connection leak)", icon: Layers },
                { phase: 4, name: "Test Hypotheses", desc: "Executes diagnostic queries in sandbox to validate or refute each theory", icon: Activity },
                { phase: 5, name: "Root Cause Conclusion", desc: "Synthesizes proven hypotheses into high-confidence root cause findings", icon: CheckCircle2 },
                { phase: 6, name: "Human Approval Gate", desc: "Pauses harness on critical modifications. Awaits operator authorization", icon: Shield },
                { phase: 7, name: "Safe Execution", desc: "Applies remediations, crafts GitHub PRs, and generates rollback safeguards", icon: GitPullRequest },
                { phase: 8, name: "Cryptographic Report", desc: "Seals all audit logs into an immutable SHA-256 Merkle root certificate", icon: Lock },
              ].map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.phase} className="card p-5 space-y-2.5 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-mono text-xs font-bold">
                        #{p.phase}
                      </span>
                      <Icon className="w-4 h-4 text-indigo-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white">{p.name}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{p.desc}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 3: System Specs & Benchmark Metrics */}
          {activeArchTab === "specs" && (
            <div className="card p-8 space-y-6 border-white/[0.1] animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div>
                  <h3 className="text-lg font-bold text-white">System Benchmarks &amp; Test Suite Results</h3>
                  <p className="text-xs text-slate-400 mt-1">Verified on 11 Jest test suites and 70/70 passing automated tests</p>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  100% Tests Passing
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono">
                <div className="p-4 rounded-xl bg-[#14172a] border border-white/[0.06]">
                  <span className="text-[10px] text-slate-500 uppercase">Avg Investigation Speed</span>
                  <p className="text-2xl font-black text-indigo-300 mt-1">131ms</p>
                </div>

                <div className="p-4 rounded-xl bg-[#14172a] border border-white/[0.06]">
                  <span className="text-[10px] text-slate-500 uppercase">Risk Evaluation Latency</span>
                  <p className="text-2xl font-black text-cyan-300 mt-1">2ms</p>
                </div>

                <div className="p-4 rounded-xl bg-[#14172a] border border-white/[0.06]">
                  <span className="text-[10px] text-slate-500 uppercase">Merkle Root Generation</span>
                  <p className="text-2xl font-black text-emerald-300 mt-1">5ms</p>
                </div>

                <div className="p-4 rounded-xl bg-[#14172a] border border-white/[0.06]">
                  <span className="text-[10px] text-slate-500 uppercase">Multi-Session Isolation</span>
                  <p className="text-2xl font-black text-purple-300 mt-1">124ms</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Core Architectural Pillars (Track 1, 2, 3) */}
      <section id="features" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-bold flex items-center justify-center gap-2">
              <Award className="w-4 h-4 text-indigo-400" /> Complete Hackathon Track Alignment
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Why AuditForge Wins Every Track
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Architected specifically to solve the safety, governance, and auditability gaps in autonomous AI agents.
            </p>
          </div>

          {/* 3 Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Track 1 Pillar */}
            <div className="card p-5 sm:p-6 space-y-3.5 border-indigo-500/30">
              <div className="p-2.5 w-fit rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-md">
                <Cpu className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-indigo-400">Track 1 • $5,000 DGX Spark</span>
                <h3 className="text-base font-bold text-white mt-0.5">TrueForge Agent Runtime</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Reaches real tools via MCP (`filesystem`, `github`, `shell`, `http-api`), isolates untrusted scripts in Daytona containers, and persists session states across restarts in SQLite.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-200 font-mono pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Real-time tool call interception
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Pre &amp; post-execution verification
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Subagent context isolation
                </li>
              </ul>
            </div>

            {/* Track 2 Pillar */}
            <div className="card p-5 sm:p-6 space-y-3.5 border-amber-500/30">
              <div className="p-2.5 w-fit rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-md">
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-amber-400">Track 3 • Apple iPad</span>
                <h3 className="text-base font-bold text-white mt-0.5">Zero-Trust Human Gate</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Dynamic risk engine scores every action from 1-10. Any high-risk step (&gt;7) halts execution and gives human operators full authority to Authorize, Deny, or Modify parameters.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-200 font-mono pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Real-time blast radius radar
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Live JSON command parameter editor
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Worst-case &amp; best-case analysis
                </li>
              </ul>
            </div>

            {/* Track 3 Pillar */}
            <div className="card p-5 sm:p-6 space-y-3.5 border-cyan-500/30">
              <div className="p-2.5 w-fit rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-md">
                <Lock className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-cyan-400">Track 2 • $1,000 Mac Mini</span>
                <h3 className="text-base font-bold text-white mt-0.5">Cryptographic Merkle Proofs</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Every action, payload, decision, and timestamp is hashed into an immutable SHA-256 binary Merkle tree, generating verifiable on-chain attestation certificates.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-200 font-mono pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 11/11 Jest suites &amp; 70/70 tests passed
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> In-browser 4-step proof validator
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Signed JSON certificate export
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section id="comparison" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-t border-white/[0.08] bg-[#0e101f]/70">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-bold">
              The Architecture Difference
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Traditional AI Agents vs AuditForge
            </h2>
          </div>

          <div className="card overflow-hidden shadow-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#17192f] border-b border-white/[0.08] text-slate-300 font-mono text-[10px] uppercase">
                <tr>
                  <th className="py-3 px-4">Capability</th>
                  <th className="py-3 px-4 text-slate-400">Traditional Black-Box Agents</th>
                  <th className="py-3 px-4 text-indigo-300 font-bold bg-indigo-500/10">AuditForge + TrueForge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-slate-300 text-xs">
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Execution Safety</td>
                  <td className="py-3 px-4 text-slate-400">Unrestricted host execution or no sandbox</td>
                  <td className="py-3 px-4 font-semibold text-emerald-300 bg-indigo-500/5">Isolated Daytona container sandbox</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Human Governance</td>
                  <td className="py-3 px-4 text-slate-400">Blind autonomous execution</td>
                  <td className="py-3 px-4 font-semibold text-emerald-300 bg-indigo-500/5">Pre-execution risk gate (Risk &gt; 7 pauses loop)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Auditability &amp; Proof</td>
                  <td className="py-3 px-4 text-slate-400">Ephemeral plain-text logs</td>
                  <td className="py-3 px-4 font-semibold text-emerald-300 bg-indigo-500/5">Cryptographic SHA-256 Merkle root certs</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Time-Machine Replay</td>
                  <td className="py-3 px-4 text-slate-400">Not possible</td>
                  <td className="py-3 px-4 font-semibold text-emerald-300 bg-indigo-500/5">Step-by-step scrubber with 1x/2x/5x playback</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Code Quality &amp; Tests</td>
                  <td className="py-3 px-4 text-slate-400">Minimal test coverage</td>
                  <td className="py-3 px-4 font-semibold text-emerald-300 bg-indigo-500/5">70/70 green tests &amp; Qodo PR review workflow</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-t border-white/[0.08] text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-4 relative">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Ready to Experience Verifiable Incident Triage?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Launch the interactive command center and test the agent across real-world incidents in seconds.
          </p>
          <div className="pt-2">
            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-950/80 ring-1 ring-white/20 transition-all hover:scale-105"
            >
              Launch AuditForge Command Center <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-8 text-xs text-slate-400 font-mono bg-[#090a14]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-300 font-semibold">AuditForge — Verifiable Incident Investigation Agent</span>
          </div>
          <div>
            <span>🏆 Agent Harness Hackathon 2026 • TrueForge Runtime • Verified by Qodo</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
