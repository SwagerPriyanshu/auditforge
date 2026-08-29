import { useEffect, useRef, useState, useCallback } from "react";
import type { AgentEvent } from "../types";

export function useWebSocket(sessionId: string | null) {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const es = new EventSource(`/api/sessions/${sessionId}/events`);
    sourceRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    const eventTypes = [
      "thinking", "plan_created", "evidence_collected", "hypothesis_formed",
      "hypothesis_tested", "conclusion_reached", "approval_request",
      "approval_decision", "action_executed", "outcome_verified",
      "report_generated", "tool_call", "tool_result", "message", "error", "complete",
    ];

    for (const type of eventTypes) {
      es.addEventListener(type, (e) => {
        try {
          const event = JSON.parse((e as unknown as MessageEvent).data) as AgentEvent;
          setEvents((prev) => [...prev, event]);
        } catch { /* ignore */ }
      });
    }

    return () => { es.close(); sourceRef.current = null; setConnected(false); };
  }, [sessionId]);

  const clearEvents = useCallback(() => setEvents([]), []);

  return { events, connected, clearEvents };
}
