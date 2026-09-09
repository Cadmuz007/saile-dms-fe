import { clearSession, readStoredSession } from "@/features/auth/session-storage";
import type { EligibleLicenseUser, LicenseHistory, LicensesResult, ManagedLicense } from "@/features/admin/licenses.types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class LicensesRequestError extends Error {
  constructor(message: string, readonly status: number, readonly fields: Record<string, string> = {}) { super(message); }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<{ data: T; meta?: LicensesResult["meta"] }> {
  const session = readStoredSession();
  if (!session) throw new LicensesRequestError("Your session has expired. Sign in again.", 401);
  const response = await fetch(`${apiBaseUrl}/admin/licenses${path}`, {
    ...options, cache: "no-store",
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` },
  });
  if (response.status === 401) {
    clearSession();
    throw new LicensesRequestError("Your session has expired. Sign in again.", 401);
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    const fields = Object.fromEntries((payload?.error?.details ?? []).map((item: { field: string; message: string }) => [item.field, item.message]));
    throw new LicensesRequestError(payload?.error?.message ?? "License management is unavailable. Please try again.", response.status, fields);
  }
  return payload;
}

export function listLicenses(query: Record<string, string>, signal: AbortSignal): Promise<LicensesResult> {
  return request<ManagedLicense[]>(`?${new URLSearchParams(query)}`, { signal }) as Promise<LicensesResult>;
}
export async function listEligibleLicenseUsers(search: string, page: number, signal: AbortSignal) {
  return (await request<EligibleLicenseUser[]>(`/eligible-users?${new URLSearchParams({ search, page: String(page), pageSize: "25" })}`, { signal })).data;
}
export async function getLicenseHistory(id: string, signal: AbortSignal) {
  return (await request<LicenseHistory>(`/${encodeURIComponent(id)}/history`, { signal })).data;
}
export async function generateLicense(expiresAt: string) {
  return (await request<ManagedLicense>("", { method: "POST", body: JSON.stringify({ expiresAt }) })).data;
}
export async function renewLicense(id: string, expiresAt: string) {
  return (await request<ManagedLicense>(`/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ expiresAt }) })).data;
}
export async function assignLicense(id: string, userId: string) {
  return (await request<ManagedLicense>(`/${encodeURIComponent(id)}/assign`, { method: "POST", body: JSON.stringify({ userId }) })).data;
}
export async function reassignLicense(id: string, userId: string) {
  return (await request<ManagedLicense>(`/${encodeURIComponent(id)}/reassign`, { method: "POST", body: JSON.stringify({ userId }) })).data;
}
export async function revokeLicenseAssignment(id: string) {
  return (await request<ManagedLicense>(`/${encodeURIComponent(id)}/revoke`, { method: "POST", body: "{}" })).data;
}
