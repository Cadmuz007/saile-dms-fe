import { clearSession, readStoredSession } from "@/features/auth/session-storage";
export interface AccountConfiguration { lockoutMinutes: number; idleMinutes?: number; }
export interface AccountPolicyRevision { id: string | null; revision: number; configuration: AccountConfiguration; createdAt: string | null; actor: { id: string; firstName: string; lastName: string } | null; }
export interface AccountPolicySettings { current: AccountPolicyRevision; history: AccountPolicyRevision[]; }
export class AccountPolicyRequestError extends Error { constructor(message: string, readonly status: number) { super(message); } }
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
async function request<T>(options: RequestInit = {}): Promise<T> {
  const session = readStoredSession();
  if (!session) throw new AccountPolicyRequestError("Your session has expired. Sign in again.", 401);
  const response = await fetch(`${apiBaseUrl}/admin/account-policy`, { ...options, cache: "no-store", headers: {
    Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}`,
  } });
  if (response.status === 401) { clearSession(); throw new AccountPolicyRequestError("Your session has expired. Sign in again.", 401); }
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) throw new AccountPolicyRequestError(payload?.error?.message ?? "Account policy settings are unavailable.", response.status);
  return payload.data as T;
}
export const getAccountPolicySettings = (signal?: AbortSignal) => request<AccountPolicySettings>({ signal });
export const saveAccountPolicySettings = (expectedRevision: number, configuration: AccountConfiguration) => request<AccountPolicyRevision>({ method: "PUT", body: JSON.stringify({ expectedRevision, configuration }) });
