import { clearSession, readStoredSession } from "@/features/auth/session-storage";

export interface SlaConfiguration {
  responseHours: number;
  reviewHours: number;
  reminderHours: 4 | 8 | 12;
  calendar: { timeZone: "Asia/Manila"; workingDays: number[]; periods: { start: string; end: string }[]; holidays: string[] };
}
export interface SlaRevision { id: string | null; revision: number; configuration: SlaConfiguration; createdAt: string | null; actor: { id: string; firstName: string; lastName: string } | null; }
export interface SlaSettings { current: SlaRevision; history: SlaRevision[]; }
export class SlaRequestError extends Error { constructor(message: string, readonly status: number) { super(message); } }
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
async function request<T>(options: RequestInit = {}): Promise<T> {
  const session = readStoredSession();
  if (!session) throw new SlaRequestError("Your session has expired. Sign in again.", 401);
  const response = await fetch(`${apiBaseUrl}/admin/sla`, { ...options, cache: "no-store", headers: {
    Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}`,
  } });
  if (response.status === 401) { clearSession(); throw new SlaRequestError("Your session has expired. Sign in again.", 401); }
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) throw new SlaRequestError(payload?.error?.message ?? "SLA settings are unavailable.", response.status);
  return payload.data as T;
}
export const getSlaSettings = (signal?: AbortSignal) => request<SlaSettings>({ signal });
export const saveSlaSettings = (expectedRevision: number, configuration: SlaConfiguration) => request<SlaRevision>({ method: "PUT", body: JSON.stringify({ expectedRevision, configuration }) });
