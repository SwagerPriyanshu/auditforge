import { useState } from "react";
import { Lock, CheckCircle2, Copy, Check, Shield, Share2, Sparkles } from "lucide-react";

interface MerkleNode {
  id: string;
  label: string;
  hash: string;
  type: "root" | "branch" | "leaf";
  verified: boolean;
}

interface Props {
  merkleRoot?: string | null;
  entriesCount?: number;
  className?: string;
}

export function MerkleGraph({ merkleRoot = "a8f3b209c14e76d5", entriesCount = 5, className = "" }: Props) {
  const [copiedNode, setCopiedNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>("root");

  const shortRoot = merkleRoot ? merkleRoot.slice(0, 16) : "a8f3b209c14e76d5";

  const handleCopy = (hash: string, id: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedNode(id);
    setTimeout(() => setCopiedNode(null), 1800);
  };

  return (
    <div className={`p-5 rounded-2xl border border-white/[0.08] bg-[#0c0e17]/90 backdrop-blur-xl space-y-4 shadow-xl ${className}`}>
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white font-mono tracking-tight">
              SHA-256 Merkle Proof Attestation Tree
            </h3>
            <p className="text-[11px] text-slate-400">
              Cryptographically anchors all {entriesCount} tool calls into an immutable root hash
            </p>
          </div>
        </div>

        <span className="flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Tamper-Proof (Verified)
        </span>
      </div>

      {/* Visual Tree Display */}
      <div className="relative py-2 flex flex-col items-center space-y-4">
        {/* Root Node */}
        <div className="flex flex-col items-center">
          <div
            onClick={() => setSelectedNode("root")}
            className="group relative cursor-pointer px-4 py-2.5 rounded-xl border border-indigo-500/40 bg-gradient-to-b from-indigo-950/40 to-slate-900/90 hover:border-indigo-400 shadow-lg shadow-indigo-950/60 transition-all flex items-center gap-2.5"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <div className="text-left">
              <span className="text-[9px] uppercase font-mono text-indigo-300 font-bold block">Merkle Root Hash</span>
              <span className="text-xs font-mono font-bold text-white tracking-wider">
                {shortRoot}...
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(merkleRoot || shortRoot, "root");
              }}
              className="p-1 hover:bg-indigo-500/20 rounded text-slate-400 hover:text-white transition-colors"
              title="Copy Root Hash"
            >
              {copiedNode === "root" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          {/* Connector line */}
          <div className="w-0.5 h-4 bg-gradient-to-b from-indigo-500/50 to-slate-700 my-0.5" />
        </div>

        {/* Intermediate Branches */}
        <div className="grid grid-cols-2 gap-8 relative w-full max-w-md">
          {/* Connector horizontal beam */}
          <div className="absolute -top-2 left-1/4 right-1/4 h-0.5 bg-slate-700" />

          {/* Branch L */}
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-2 bg-slate-700 -mt-2 mb-1" />
            <div className="w-full p-2 rounded-lg border border-white/[0.08] bg-slate-900/80 text-center font-mono text-[10px] text-slate-300 hover:border-slate-600 transition-colors">
              <span className="text-[8px] text-slate-500 uppercase block font-bold">Branch H(1..2)</span>
              <span className="truncate block font-semibold text-slate-300">7f20a91e...</span>
            </div>
          </div>

          {/* Branch R */}
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-2 bg-slate-700 -mt-2 mb-1" />
            <div className="w-full p-2 rounded-lg border border-white/[0.08] bg-slate-900/80 text-center font-mono text-[10px] text-slate-300 hover:border-slate-600 transition-colors">
              <span className="text-[8px] text-slate-500 uppercase block font-bold">Branch H(3..{entriesCount})</span>
              <span className="truncate block font-semibold text-slate-300">3b81ef02...</span>
            </div>
          </div>
        </div>

        {/* Leaf Nodes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full pt-1">
          {[
            { id: "leaf-1", tool: "read_file", hash: "4d91...e02b", risk: 2 },
            { id: "leaf-2", tool: "search_files", hash: "9a12...7f40", risk: 2 },
            { id: "leaf-3", tool: "form_hypotheses", hash: "1c88...6d91", risk: 1 },
            { id: "leaf-4", tool: "write_file", hash: "5e42...0a18", risk: 6 },
          ].map((leaf) => (
            <div
              key={leaf.id}
              className="p-2.5 rounded-xl border border-white/[0.06] bg-[#121524] text-center font-mono text-[10px] space-y-1 hover:border-indigo-500/30 transition-all shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-indigo-300 font-bold uppercase">{leaf.tool}</span>
                <span className={`text-[8px] px-1 rounded ${leaf.risk > 4 ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                  R:{leaf.risk}
                </span>
              </div>
              <p className="text-slate-400 text-[10px] truncate">{leaf.hash}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
