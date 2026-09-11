import { clearSession, readStoredSession } from "@/features/auth/session-storage";
import type { AvailableDocumentType, DocumentTypeInput, DocumentTypesResult, ManagedDocumentType, VisibilityCandidates } from "@/features/admin/document-types.types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class DocumentTypesRequestError extends Error {
  constructor(message: string, readonly status: number, readonly fields: Record<string, string> = {}) { super(message); }
}

async function request<T>(path: string, options: RequestInit = {}) {
  const session = readStoredSession();
  if (!session) throw new DocumentTypesRequestError("Your session has expired. Sign in again.", 401);
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${session.accessToken}`);
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers, cache: "no-store" });
  if (response.status === 401) { clearSession(); throw new DocumentTypesRequestError("Your session has expired. Sign in again.", 401); }
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    const fields = Object.fromEntries((payload?.error?.details ?? []).map((item: { field: string; message: string }) => [item.field, item.message]));
    throw new DocumentTypesRequestError(payload?.error?.message ?? "Document type management is unavailable. Please try again.", response.status, fields);
  }
  return payload as { data: T; meta?: DocumentTypesResult["meta"] };
}

export async function listDocumentTypes(query: Record<string, string>, signal: AbortSignal): Promise<DocumentTypesResult> {
  const result = await request<ManagedDocumentType[]>(`/admin/document-types?${new URLSearchParams(query)}`, { signal });
  return { data: result.data, meta: result.meta! };
}

export async function listAvailableDocumentTypes(signal?: AbortSignal): Promise<AvailableDocumentType[]> {
  return (await request<AvailableDocumentType[]>("/document-types", { signal })).data;
}

export async function createDocumentType(input: DocumentTypeInput) {
  return (await request<ManagedDocumentType>("/admin/document-types", { method: "POST", body: JSON.stringify(input) })).data;
}

export async function listVisibilityCandidates(search: string, signal?: AbortSignal): Promise<VisibilityCandidates> {
  return (await request<VisibilityCandidates>(`/admin/document-types/visibility-candidates?${new URLSearchParams({ search })}`, { signal })).data;
}

export async function updateDocumentType(id: string, input: DocumentTypeInput) {
  return (await request<ManagedDocumentType>(`/admin/document-types/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) })).data;
}

export async function archiveDocumentType(id: string) {
  return (await request<ManagedDocumentType>(`/admin/document-types/${encodeURIComponent(id)}/archive`, { method: "POST", body: "{}" })).data;
}
