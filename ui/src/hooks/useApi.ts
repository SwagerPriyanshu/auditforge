const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? res.statusText);
  }
  return res.json();
}

export const api = {
  // Sessions
  getSessions: () => request<{ sessions: Array<Record<string, unknown>> }>("/sessions"),
  createSession: (data: { title: string; incident: string; model?: string }) =>
    request<Record<string, unknown>>("/sessions", { method: "POST", body: JSON.stringify(data) }),
  getSession: (id: string) => request<Record<string, unknown>>(`/sessions/${id}`),
  investigate: (id: string) =>
    request<Record<string, unknown>>(`/sessions/${id}/investigate`, { method: "POST" }),

  // Audit
  getAuditLog: (id: string) => request<{ sessionId: string; entries: Array<Record<string, unknown>> }>(`/sessions/${id}/audit`),
  getAttestation: (id: string) => request<{ attestation: Record<string, unknown>; verification: Record<string, unknown> }>(`/sessions/${id}/attestation`),
  replay: (id: string) => request<Record<string, unknown>>(`/sessions/${id}/replay`),

  // Approvals
  getPendingApprovals: (id: string) => request<{ pending: Array<Record<string, unknown>> }>(`/sessions/${id}/approvals`),
  approve: (sessionId: string, data: { callId: string; decision: string; modifiedInput?: Record<string, unknown>; reason?: string }) =>
    request<Record<string, unknown>>(`/sessions/${sessionId}/approve`, { method: "POST", body: JSON.stringify(data) }),

  // System & Presets
  getSystemStatus: () => request<Record<string, unknown>>("/system/status"),
  pingMcpServer: (server: string) =>
    request<{ server: string; status: string; latencyMs: number; verified: boolean }>("/system/mcp/ping", { method: "POST", body: JSON.stringify({ server }) }),
  testSandbox: () =>
    request<{ sandboxId: string; status: string; chrootActive: boolean; readOnlyRoots: string[]; networkIsolated: boolean; probeLatencyMs: number }>("/system/sandbox/test", { method: "POST" }),
  runPreset: (preset: string) =>
    request<Record<string, unknown>>("/demo/preset", { method: "POST", body: JSON.stringify({ preset }) }),
};
