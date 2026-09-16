import { clearSession, readStoredSession } from "@/features/auth/session-storage";
export interface StorageConfiguration { quotaGb: number; blockOverQuota: boolean; }
export interface StoragePolicyRevision { id: string | null; revision: number; configuration: StorageConfiguration; createdAt: string | null; actor: { id: string; firstName: string; lastName: string } | null; }
export interface StoragePolicySettings { current: StoragePolicyRevision; history: StoragePolicyRevision[]; }
export class StoragePolicyRequestError extends Error { constructor(message: string, readonly status: number) { super(message); } }
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
async function request<T>(options: RequestInit = {}): Promise<T> {
  const session = readStoredSession();
  if (!session) throw new StoragePolicyRequestError("Your session has expired. Sign in again.", 401);
  const response = await fetch(`${apiBaseUrl}/admin/storage-policy`, { ...options, cache: "no-store", headers: {
    Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}`,
  } });
  if (response.status === 401) { clearSession(); throw new StoragePolicyRequestError("Your session has expired. Sign in again.", 401); }
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) throw new StoragePolicyRequestError(payload?.error?.message ?? "Storage policy settings are unavailable.", response.status);
  return payload.data as T;
}
export const getStoragePolicySettings = (signal?: AbortSignal) => request<StoragePolicySettings>({ signal });
export const saveStoragePolicySettings = (expectedRevision: number, configuration: StorageConfiguration) => request<StoragePolicyRevision>({ method: "PUT", body: JSON.stringify({ expectedRevision, configuration }) });
