import { useState, useEffect } from "react";
import { Search, Download, Filter, ArrowLeft, ShieldCheck, Database, FileText, ChevronRight, Lock, Hash } from "lucide-react";
import { api } from "../hooks/useApi";
import { ToolCallCard } from "./ToolCallCard";
import { RiskBadge } from "./RiskBadge";
import type { AuditEntry } from "../types";

export function AuditViewer({ sessionId, onBack }: { sessionId: string; onBack: () => void }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [filtered, setFiltered] = useState<AuditEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [attestation, setAttestation] = useState<Record<string, unknown> | null>(null);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    if (!sessionId) return;
    api.getAuditLog(sessionId)
      .then((d) => {
        const ent = d.entries as unknown as AuditEntry[];
        setEntries(ent);
        setFiltered(ent);
        if (ent.length > 0) setSelectedEntry(ent[0]);
      })
      .catch(() => {});
    api.getAttestation(sessionId)
      .then((d) => setAttestation(d.attestation))
      .catch(() => {});
  }, [sessionId]);

  useEffect(() => {
    let result = entries;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.toolName.toLowerCase().includes(q) ||
          e.actionTaken.toLowerCase().includes(q) ||
          e.toolInput.toLowerCase().includes(q) ||
          e.toolOutput.toLowerCase().includes(q)
      );
    }
    if (riskFilter !== "all") {
      const [min, max] = riskFilter.split("-").map(Number);
      result = result.filter((e) => e.riskScore >= min && e.riskScore <= max);
    }
    if (categoryFilter !== "all") {
      result = result.filter((e) => e.toolCategory === categoryFilter);
    }
    setFiltered(result);
  }, [search, riskFilter, categoryFilter, entries]);

  const exportJson = () => {
    const blob = new Blob(
      [JSON.stringify({ sessionId, generatedAt: new Date().toISOString(), entries: filtered, attestation }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditforge-session-${sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const categories = Array.from(new Set(entries.map((e) => e.toolCategory || "general")));

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-surface-4/40 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-surface-3 rounded-xl transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>
          <div>
            <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-brand-400" />
              Cryptographic Audit Ledger
            </h2>
            <p className="text-xs text-gray-400">
              Immutable ledger of intercepted tool calls, risk assessments, and approvals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 hover:bg-surface-3 border border-surface-4 rounded-xl text-xs font-semibold text-gray-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export JSON Proof
          </button>
        </div>
      </div>

      {/* Attestation Proof Badge */}
      {attestation && (
        <div className="glass p-4 border-brand-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-200 font-mono">Merkle Root Attestation</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  Chain Verified
                </span>
              </div>
              <p className="font-mono text-xs text-brand-300 break-all select-all font-semibold mt-0.5">
                {String(attestation.merkleRoot)}
              </p>
            </div>
          </div>
          <span className="text-xs text-gray-400 font-mono shrink-0">
            {String(attestation.leafCount)} Cryptographic Leaves
          </span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by tool name, parameters, errors..."
            className="w-full pl-10 pr-4 py-2 bg-surface-2 border border-surface-4 rounded-xl text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500/60"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="w-full px-3 py-2 bg-surface-2 border border-surface-4 rounded-xl text-xs text-gray-300 focus:outline-none focus:border-brand-500/60"
          >
            <option value="all">All Risk Levels</option>
            <option value="1-3">Safe & Low (1-3)</option>
            <option value="4-6">Moderate (4-6)</option>
            <option value="7-8">High Risk (7-8)</option>
            <option value="9-10">Critical Risk (9-10)</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 bg-surface-2 border border-surface-4 rounded-xl text-xs text-gray-300 focus:outline-none focus:border-brand-500/60"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Two-Column Explorer: List + Side-by-Side Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Filtered List */}
        <div className="lg:col-span-6 space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="glass p-8 text-center text-xs text-gray-500">
              No audit entries found matching your filters.
            </div>
          ) : (
            filtered.map((entry) => (
              <div
                key={entry.id}
                onClick={() => setSelectedEntry(entry)}
                className={`cursor-pointer transition-all ${
                  selectedEntry?.id === entry.id ? "ring-2 ring-brand-500/60 rounded-xl" : ""
                }`}
              >
                <ToolCallCard entry={entry} />
              </div>
            ))
          )}
        </div>

        {/* Right Column: Deep-Dive Payload Inspector */}
        <div className="lg:col-span-6">
          {selectedEntry ? (
            <div className="glass p-5 space-y-4 border-brand-500/30 sticky top-20 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-surface-4/40">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-brand-300">{selectedEntry.toolName}</span>
                  <RiskBadge score={selectedEntry.riskScore} size="sm" />
                </div>
                <span className="text-[11px] font-mono text-gray-400">
                  {new Date(selectedEntry.timestamp).toLocaleString()}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">Action Summary</span>
                  <p className="text-gray-200 mt-0.5 font-medium">{selectedEntry.actionTaken}</p>
                </div>

                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">Input Payload</span>
                  <pre className="p-3 mt-1 bg-surface-0 rounded-xl text-[11px] font-mono text-gray-300 overflow-x-auto max-h-40 border border-surface-4/40">
                    {selectedEntry.toolInput}
                  </pre>
                </div>

                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">Sanitized Output Payload</span>
                  <pre className="p-3 mt-1 bg-surface-0 rounded-xl text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-40 border border-surface-4/40">
                    {selectedEntry.toolOutput}
                  </pre>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-4/40 font-mono text-[10px]">
                  <div>
                    <span className="text-gray-500">EVIDENCE HASH</span>
                    <p className="text-brand-400 font-bold truncate">{selectedEntry.evidenceHash}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">PARENT HASH</span>
                    <p className="text-gray-400 truncate">{selectedEntry.parentHash || "Genesis 0x00"}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass p-12 text-center text-xs text-gray-500">
              Select an entry to view deep payload parameters & cryptographic linkage.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
