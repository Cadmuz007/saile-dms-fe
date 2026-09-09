import { clearSession, readStoredSession } from "@/features/auth/session-storage";
import type { AvailableLicense, CreateUserInput, ManagedUser, UserProfileInput, UsersResult } from "@/features/admin/users.types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class UsersRequestError extends Error {
  constructor(message: string, readonly status: number, readonly fields: Record<string, string> = {}) { super(message); }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<{ data: T; meta: UsersResult["meta"] }> {
  const session = readStoredSession();
  if (!session) throw new UsersRequestError("Your session has expired. Sign in again.", 401);
  const response = await fetch(`${apiBaseUrl}/admin/users${path}`, {
    ...options, cache: "no-store",
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` },
  });
  if (response.status === 401) {
    clearSession();
    throw new UsersRequestError("Your session has expired. Sign in again.", 401);
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    const fields = Object.fromEntries((payload?.error?.details ?? []).map((item: { field: string; message: string }) => [item.field, item.message]));
    throw new UsersRequestError(payload?.error?.message ?? "User management is unavailable. Please try again.", response.status, fields);
  }
  return payload;
}

export function listUsers(query: Record<string, string>, signal: AbortSignal): Promise<UsersResult> {
  return request<ManagedUser[]>(`?${new URLSearchParams(query)}`, { signal });
}
export async function findAvailableLicenses(search: string, page: number, signal: AbortSignal) {
  return (await request<AvailableLicense[]>(`/available-licenses?${new URLSearchParams({ search, page: String(page), pageSize: "25" })}`, { signal })).data;
}
export async function createUser(input: CreateUserInput) {
  return (await request<ManagedUser>("", { method: "POST", body: JSON.stringify(input) })).data;
}
export async function updateUser(id: string, input: UserProfileInput) {
  return (await request<ManagedUser>(`/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) })).data;
}
export async function archiveUser(id: string) {
  return (await request<ManagedUser>(`/${encodeURIComponent(id)}/archive`, { method: "POST", body: "{}" })).data;
}
