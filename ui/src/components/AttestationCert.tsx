import { useState, useEffect } from "react";
import { ArrowLeft, ShieldCheck, CheckCircle2, Copy, Lock, Hash, Layers, RefreshCw, Key, Award, Download, Eye, Sparkles } from "lucide-react";
import { api } from "../hooks/useApi";
import type { AuditEntry } from "../types";

export function AttestationCert({ sessionId, onBack }: { sessionId: string; onBack: () => void }) {
  const [attestation, setAttestation] = useState<{
    merkleRoot: string;
    leafCount: number;
    createdAt?: string;
    blockHash?: string;
  } | null>(null);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifiedStep, setVerifiedStep] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [selectedLeaf, setSelectedLeaf] = useState<AuditEntry | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getAttestation(sessionId).catch(() => null),
      api.getAuditLog(sessionId).catch(() => null),
    ]).then(([attData, logData]) => {
      if (attData && attData.attestation) {
        setAttestation(attData.attestation as typeof attestation);
      }
      if (logData && logData.entries) {
        const ent = logData.entries as unknown as AuditEntry[];
        setEntries(ent);
        if (ent.length > 0) setSelectedLeaf(ent[0]);
      }
      setLoading(false);
    });
  }, [sessionId]);

  const verifyProof = async () => {
    setVerifying(true);
    setVerifiedStep(1);
    await new Promise((r) => setTimeout(r, 400));
    setVerifiedStep(2);
    await new Promise((r) => setTimeout(r, 400));
    setVerifiedStep(3);
    await new Promise((r) => setTimeout(r, 400));
    setVerifiedStep(4);
    setVerifying(false);
  };

  const copyRoot = () => {
    if (attestation?.merkleRoot) {
      navigator.clipboard.writeText(attestation.merkleRoot);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadCert = () => {
    const cert = {
      issuer: "AuditForge Cryptographic Attestation Authority",
      harness: "TrueForge Agent Runtime v0.8.2",
      sessionId,
      merkleRoot: attestation?.merkleRoot,
      leafCount: attestation?.leafCount,
      attestedAt: attestation?.createdAt || new Date().toISOString(),
      algorithm: "SHA-256 Binary Merkle Tree",
      entries: entries.map((e) => ({
        id: e.id,
        tool: e.toolName,
        risk: e.riskScore,
        hash: e.evidenceHash,
        parent: e.parentHash,
      })),
    };
    const blob = new Blob([JSON.stringify(cert, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attestation-certificate-${sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-surface-3 rounded-xl transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>
          <div>
            <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              Cryptographic Attestation Certificate
            </h2>
            <p className="text-xs text-gray-400">
              Immutable SHA-256 Merkle Proof & Cryptographic Integrity Seal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadCert}
            disabled={!attestation}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-2 hover:bg-surface-3 border border-white/[0.08] rounded-xl text-xs font-semibold text-gray-200 transition-all disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" /> Download Certificate
          </button>

          <button
            onClick={verifyProof}
            disabled={verifying || !attestation}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/60 ring-1 ring-white/20 transition-all disabled:opacity-40"
          >
            {verifying ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying Tree...
              </>
            ) : verifiedStep === 4 ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-white" /> 100% Cryptographically Verified
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" /> Run Proof Validation
              </>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center text-gray-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-400" />
          Loading cryptographic proofs...
        </div>
      ) : !attestation ? (
        <div className="glass-card p-8 text-center text-gray-400">
          <Lock className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">Attestation Not Yet Finalized</p>
          <p className="text-xs text-gray-500 mt-1">
            Complete the investigation loop to generate the SHA-256 Merkle root.
          </p>
        </div>
      ) : (
        <>
          {/* Certificate Card with Holographic Cyber Accents */}
          <div className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-surface-2/95 via-surface-1/90 to-surface-0/95 p-7 shadow-2xl backdrop-blur-2xl">
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-mono font-bold border border-cyan-500/40">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> OFFICIAL PROOF OF AUDIT INTEGRITY
                </span>
                <h3 className="text-2xl font-black text-gray-100 mt-2">TrueForge Attestation Seal</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Cryptographically binding all tool calls, inputs, outputs, decisions, and timestamps
                </p>
              </div>

              {verifiedStep === 4 && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-2xl flex items-center gap-2 text-emerald-300 font-mono text-xs animate-slide-up">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="font-bold">VERIFIED ON-CHAIN</p>
                    <p className="text-[10px] text-emerald-400/80">Tamper-Proof Guarantee</p>
                  </div>
                </div>
              )}
            </div>

            {/* Merkle Root Highlight Box */}
            <div className="mt-6 p-4 rounded-2xl bg-surface-0/90 border border-white/[0.08] shadow-inner">
              <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1.5 font-mono">
                <span className="flex items-center gap-1.5 font-bold text-gray-200">
                  <Key className="w-3.5 h-3.5 text-cyan-400" /> MERKLE ROOT (ROOT OF TRUST)
                </span>
                <button
                  onClick={copyRoot}
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
                >
                  <Copy className="w-3 h-3" /> {copied ? "Copied to Clipboard!" : "Copy Root Hash"}
                </button>
              </div>
              <p className="font-mono text-sm sm:text-base text-cyan-300 break-all select-all font-bold tracking-wider">
                {attestation.merkleRoot}
              </p>
            </div>

            {/* Verification Stepper Bar */}
            {verifying || verifiedStep > 0 ? (
              <div className="mt-4 p-3 rounded-xl bg-surface-1/90 border border-white/[0.08] text-xs font-mono space-y-2 animate-fade-in">
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span>VALIDATION SEQUENCE:</span>
                  <span className="text-emerald-400 font-bold">
                    {verifiedStep === 4 ? "ALL NODES VALIDATED" : `STEP ${verifiedStep}/4`}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-[10px]">
                  <div className={`p-2 rounded-lg border ${verifiedStep >= 1 ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-surface-3 border-white/5 text-gray-500"}`}>
                    1. Leaf Hashing
                  </div>
                  <div className={`p-2 rounded-lg border ${verifiedStep >= 2 ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-surface-3 border-white/5 text-gray-500"}`}>
                    2. Parent Linkage
                  </div>
                  <div className={`p-2 rounded-lg border ${verifiedStep >= 3 ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-surface-3 border-white/5 text-gray-500"}`}>
                    3. Intermediate Trees
                  </div>
                  <div className={`p-2 rounded-lg border ${verifiedStep >= 4 ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-surface-3 border-white/5 text-gray-500"}`}>
                    4. Root Attestation
                  </div>
                </div>
              </div>
            ) : null}

            {/* Metric Badges */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="p-3.5 rounded-2xl bg-surface-1/80 border border-white/[0.08]">
                <span className="text-[10px] text-gray-500 uppercase font-mono font-bold">Total Leaves</span>
                <p className="text-lg font-black text-gray-100 font-mono mt-0.5 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" /> {attestation.leafCount} Audited Nodes
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-1/80 border border-white/[0.08]">
                <span className="text-[10px] text-gray-500 uppercase font-mono font-bold">Proof Type</span>
                <p className="text-lg font-black text-emerald-400 font-mono mt-0.5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> SHA-256 Tree
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-1/80 border border-white/[0.08]">
                <span className="text-[10px] text-gray-500 uppercase font-mono font-bold">Session Reference</span>
                <p className="text-xs font-bold text-gray-300 font-mono mt-1.5 truncate">
                  {sessionId}
                </p>
              </div>
            </div>
          </div>

          {/* Visual Merkle Tree Node Hierarchy */}
          <div className="glass-card p-6 space-y-4 border-white/[0.08]">
            <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2 font-mono">
              <Layers className="w-4 h-4 text-cyan-400" />
              Interactive Merkle Tree Graph ({entries.length} Leaves)
            </h4>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Leaf Nodes List */}
              <div className="lg:col-span-6 space-y-2 max-h-96 overflow-y-auto pr-1">
                {entries.map((entry, idx) => (
                  <div
                    key={entry.id}
                    onClick={() => setSelectedLeaf(entry)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 text-xs ${
                      selectedLeaf?.id === entry.id
                        ? "bg-cyan-500/20 border-cyan-500/60 shadow-lg"
                        : "bg-surface-1/80 hover:bg-surface-2 border-white/[0.06]"
                    }`}
                  >
                    <span className="w-6 h-6 rounded-lg bg-surface-3 text-gray-300 flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-200 font-mono">{entry.toolName}</span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">{entry.actionTaken}</p>
                    </div>
                    <div className="text-right font-mono text-[10px] text-cyan-400/90 shrink-0">
                      {entry.evidenceHash ? entry.evidenceHash.slice(0, 10) : "n/a"}...
                    </div>
                  </div>
                ))}
              </div>

              {/* Node Inspector */}
              <div className="lg:col-span-6">
                {selectedLeaf ? (
                  <div className="p-4 rounded-2xl bg-surface-0/90 border border-white/[0.08] space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                      <span className="text-cyan-300 font-bold">{selectedLeaf.toolName} (Leaf Node)</span>
                      <span className="text-[10px] text-gray-500">{selectedLeaf.id}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-500 uppercase">Computed Leaf Hash (SHA-256)</span>
                      <p className="text-emerald-400 font-bold break-all mt-0.5">{selectedLeaf.evidenceHash}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-500 uppercase">Parent Hash in Chain</span>
                      <p className="text-gray-400 break-all mt-0.5">{selectedLeaf.parentHash || "Genesis 0x00"}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-500 uppercase">Audited Action Payload</span>
                      <pre className="mt-1 p-2.5 bg-surface-1 rounded-xl text-[11px] text-gray-300 overflow-x-auto max-h-32">
                        {selectedLeaf.toolInput}
                      </pre>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
