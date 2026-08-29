import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuditViewer } from "../components/AuditViewer";
import { api } from "../hooks/useApi";
import type { Session } from "../types";

export function AuditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(id || null);

  useEffect(() => {
    if (id) {
      setActiveSessionId(id);
    } else {
      api.getSessions().then((d) => {
        const s = d.sessions as unknown as Session[];
        if (s.length > 0) setActiveSessionId(s[0].id);
      }).catch(() => {});
    }
  }, [id]);

  if (!activeSessionId) {
    return (
      <div className="card p-12 text-center text-zinc-500 text-xs">
        Loading audit logs...
      </div>
    );
  }

  return (
    <AuditViewer
      sessionId={activeSessionId}
      onBack={() => navigate(-1)}
    />
  );
}
