import { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipForward, ArrowLeft, RotateCcw, FastForward, Clock, Activity, Shield } from "lucide-react";
import { api } from "../hooks/useApi";
import { Timeline } from "./Timeline";
import type { AgentEvent } from "../types";

export function Replay({ sessionId, onBack }: { sessionId: string; onBack: () => void }) {
  const [allEvents, setAllEvents] = useState<AgentEvent[]>([]);
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    api.replay(sessionId)
      .then((d) => {
        const entries = d.entries as Array<Record<string, unknown>>;
        if (!entries || entries.length === 0) return;

        const eventsList: AgentEvent[] = entries.map((e, i) => ({
          id: String(e.id ?? `evt-${i}`),
          sessionId,
          type: "tool_call" as const,
          timestamp: String(e.timestamp ?? new Date().toISOString()),
          data: {
            content: `${e.tool_name}: ${e.action_taken}`,
            toolName: e.tool_name,
            riskScore: e.risk_score,
            toolInput: e.tool_input,
            toolOutput: e.tool_output,
          },
        }));

        setAllEvents(eventsList);
        setVisibleIndex(eventsList.length - 1);
      })
      .catch(() => {});
  }, [sessionId]);

  useEffect(() => {
    if (playing && visibleIndex < allEvents.length - 1) {
      timerRef.current = setInterval(() => {
        setVisibleIndex((prev) => {
          if (prev >= allEvents.length - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / speed);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, speed, visibleIndex, allEvents.length]);

  const visibleEvents = allEvents.slice(0, visibleIndex + 1);
  const currentEvent = allEvents[visibleIndex];
  const progress = allEvents.length > 0 ? ((visibleIndex + 1) / allEvents.length) * 100 : 0;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-4/40 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-surface-3 rounded-xl transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>
          <div>
            <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-400" />
              Investigation Time-Machine Replay
            </h2>
            <p className="text-xs text-gray-400">
              Deterministic step-by-step playback of all tool executions, decisions, and outcomes
            </p>
          </div>
        </div>

        <span className="font-mono text-xs text-brand-300 px-3 py-1.5 rounded-xl bg-surface-2 border border-surface-4">
          Step {visibleIndex + 1} of {allEvents.length}
        </span>
      </div>

      {/* Playback Control Deck */}
      <div className="glass p-5 border-brand-500/30 space-y-4 shadow-xl">
        {/* Progress Scrubber */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
            <span>START OF INVESTIGATION</span>
            <span className="text-brand-300 font-bold">{progress.toFixed(0)}% PLAYBACK</span>
            <span>CONCLUSION & ATTESTATION</span>
          </div>
          <div className="w-full h-2 bg-surface-0 rounded-full overflow-hidden border border-surface-4/60">
            <div
              className="h-full bg-gradient-to-r from-brand-600 via-indigo-500 to-emerald-400 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Buttons & Speed Deck */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPlaying(false);
                setVisibleIndex(0);
              }}
              title="Rewind to Start"
              className="p-2.5 bg-surface-2 hover:bg-surface-3 border border-surface-4 rounded-xl text-gray-300 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setPlaying(!playing)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-brand-950/60 transition-all"
            >
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{playing ? "Pause Playback" : "Play Replay"}</span>
            </button>

            <button
              onClick={() => {
                setPlaying(false);
                setVisibleIndex((p) => Math.min(p + 1, allEvents.length - 1));
              }}
              disabled={visibleIndex >= allEvents.length - 1}
              title="Next Step"
              className="p-2.5 bg-surface-2 hover:bg-surface-3 border border-surface-4 rounded-xl text-gray-300 transition-all disabled:opacity-40"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Toggles */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-mono">Speed:</span>
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                  speed === s
                    ? "bg-brand-500 text-white shadow-md shadow-brand-950/40"
                    : "bg-surface-2 text-gray-400 hover:text-gray-200"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="glass p-5 overflow-y-auto max-h-[500px] border-surface-4/60 shadow-xl">
        {allEvents.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500">
            No audit records available for this session. Run an investigation from the Hub!
          </div>
        ) : (
          <Timeline events={visibleEvents} />
        )}
      </div>
    </div>
  );
}
