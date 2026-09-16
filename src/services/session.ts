import { clearSession, readStoredSession, updateSession } from "@/features/auth/session-storage";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
type Renewal = { accessToken: string; idleExpiresAt: string; sessionExpiresAt: string };
let pending: Promise<Renewal> | null = null;
async function request(action: "refresh" | "activity", refreshToken: string): Promise<Renewal> {
  const response = await fetch(`${apiBaseUrl}/auth/${action}`, { method: "POST", cache: "no-store", signal: AbortSignal.timeout(10_000), headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken }) });
  if (response.status === 401) {
    if (readStoredSession()?.refreshToken === refreshToken) clearSession();
    throw new Error("Your session expired. Sign in again.");
  }
  const payload = await response.json();
  if (!response.ok || !payload.success) throw new Error("Session renewal is temporarily unavailable.");
  updateSession(refreshToken, payload.data);
  return payload.data;
}
export async function renewSession(activity = false): Promise<Renewal> {
  if (pending) { await pending; if (!activity) { const session = readStoredSession(); if (session?.idleExpiresAt && session.sessionExpiresAt) return session as Renewal; } }
  const session = readStoredSession();
  if (!session?.refreshToken) { clearSession(); throw new Error("Sign in again to start a secure session."); }
  const task = request(activity ? "activity" : "refresh", session.refreshToken);
  pending = task;
  try { return await task; } finally { if (pending === task) pending = null; }
}
export function logoutSession(): void {
  const credential = readStoredSession()?.refreshToken;
  clearSession();
  if (credential) void fetch(`${apiBaseUrl}/auth/logout`, { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken: credential }) }).catch(() => undefined);
}
