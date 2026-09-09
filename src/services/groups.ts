import { clearSession, readStoredSession } from "@/features/auth/session-storage";
import type { GroupInput, GroupMember, GroupMemberUser, GroupsResult, ManagedGroup } from "@/features/admin/groups.types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
export class GroupsRequestError extends Error {
  constructor(message: string, readonly status: number, readonly fields: Record<string, string> = {}) { super(message); }
}
async function request<T>(path: string, options: RequestInit = {}) {
  const session = readStoredSession();
  if (!session) throw new GroupsRequestError("Your session has expired. Sign in again.", 401);
  const response = await fetch(`${apiBaseUrl}/admin/groups${path}`, { ...options, cache: "no-store", headers: {
    Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}`,
  } });
  if (response.status === 401) { clearSession(); throw new GroupsRequestError("Your session has expired. Sign in again.", 401); }
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    const fields = Object.fromEntries((payload?.error?.details ?? []).map((item: { field: string; message: string }) => [item.field, item.message]));
    throw new GroupsRequestError(payload?.error?.message ?? "Group management is unavailable. Please try again.", response.status, fields);
  }
  return payload as { data: T; meta?: GroupsResult["meta"] };
}
export async function listGroups(query: Record<string, string>, signal: AbortSignal): Promise<GroupsResult> {
  const result = await request<ManagedGroup[]>(`?${new URLSearchParams(query)}`, { signal });
  return { data: result.data, meta: result.meta! };
}
export async function createGroup(input: GroupInput) { return (await request<ManagedGroup>("", { method: "POST", body: JSON.stringify(input) })).data; }
export async function updateGroup(id: string, input: GroupInput) { return (await request<ManagedGroup>(`/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) })).data; }
export async function archiveGroup(id: string) { return (await request<ManagedGroup>(`/${encodeURIComponent(id)}/archive`, { method: "POST", body: "{}" })).data; }
export async function listGroupMembers(id: string, signal?: AbortSignal) { return (await request<GroupMember[]>(`/${encodeURIComponent(id)}/members`, { signal })).data; }
export async function findMemberCandidates(id: string, search: string, signal?: AbortSignal) { return (await request<GroupMemberUser[]>(`/${encodeURIComponent(id)}/member-candidates?${new URLSearchParams({ search, page: "1", pageSize: "50" })}`, { signal })).data; }
export async function addGroupMember(id: string, userId: string) { return (await request<GroupMember>(`/${encodeURIComponent(id)}/members`, { method: "POST", body: JSON.stringify({ userId }) })).data; }
export async function removeGroupMember(id: string, userId: string) { await request(`/${encodeURIComponent(id)}/members/${encodeURIComponent(userId)}/remove`, { method: "POST", body: "{}" }); }
