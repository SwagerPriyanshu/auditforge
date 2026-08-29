import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AttestationCert } from "../components/AttestationCert";
import { api } from "../hooks/useApi";
import type { Session } from "../types";

export function AttestationPage() {
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
        Loading cryptographic proofs...
      </div>
    );
  }

  return (
    <AttestationCert
      sessionId={activeSessionId}
      onBack={() => navigate(-1)}
    />
  );
}
