import { clearSession, readStoredSession } from "@/features/auth/session-storage";
import type { PermissionGrants, PermissionGroup, PermissionsResult, PermissionUser, ManagedPermission } from "@/features/admin/permissions.types";
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
export class PermissionsRequestError extends Error { constructor(message: string, readonly status: number) { super(message); } }
async function request<T>(path: string, options: RequestInit = {}) {
  const session = readStoredSession(); if (!session) throw new PermissionsRequestError("Your session has expired. Sign in again.", 401);
  const response = await fetch(`${apiBaseUrl}/admin/permissions${path}`, { ...options, cache: "no-store", headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` } });
  if (response.status === 401) { clearSession(); throw new PermissionsRequestError("Your session has expired. Sign in again.", 401); }
  const payload = await response.json().catch(() => null); if (!response.ok || !payload?.success) throw new PermissionsRequestError(payload?.error?.message ?? "Permission management is unavailable. Please try again.", response.status);
  return payload as { data: T; meta?: PermissionsResult["meta"] };
}
export async function listPermissions(query: Record<string, string>, signal: AbortSignal): Promise<PermissionsResult> { const value = await request<ManagedPermission[]>(`?${new URLSearchParams(query)}`, { signal }); return { data: value.data, meta: value.meta! }; }
export async function getPermissionGrants(id: string, signal?: AbortSignal) { return (await request<PermissionGrants>(`/${encodeURIComponent(id)}/grants`, { signal })).data; }
export async function findGroupCandidates(id: string, search: string, signal?: AbortSignal) { return (await request<PermissionGroup[]>(`/${encodeURIComponent(id)}/group-candidates?${new URLSearchParams({ search, page: "1", pageSize: "50" })}`, { signal })).data; }
export async function findUserCandidates(id: string, search: string, signal?: AbortSignal) { return (await request<PermissionUser[]>(`/${encodeURIComponent(id)}/user-candidates?${new URLSearchParams({ search, page: "1", pageSize: "50" })}`, { signal })).data; }
export async function grantGroupPermission(id: string, groupId: string) { await request(`/${encodeURIComponent(id)}/group-grants`, { method: "POST", body: JSON.stringify({ groupId }) }); }
export async function grantUserPermission(id: string, userId: string) { await request(`/${encodeURIComponent(id)}/user-grants`, { method: "POST", body: JSON.stringify({ userId }) }); }
export async function revokeGroupPermission(id: string, groupId: string) { await request(`/${encodeURIComponent(id)}/group-grants/${encodeURIComponent(groupId)}/revoke`, { method: "POST", body: "{}" }); }
export async function revokeUserPermission(id: string, userId: string) { await request(`/${encodeURIComponent(id)}/user-grants/${encodeURIComponent(userId)}/revoke`, { method: "POST", body: "{}" }); }
