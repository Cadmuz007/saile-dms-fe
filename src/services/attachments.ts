import { clearSession, readStoredSession } from "@/features/auth/session-storage";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export interface ApiAttachmentVersion {
  id: string; versionNumber: number; originalFilename: string; detectedMimeType: string; byteSize: number; uploadedAt: string;
  uploadedBy: { id: string; firstName: string; lastName: string };
}
export interface ApiAttachment {
  id: string; name: string; status: "ACTIVE" | "ARCHIVED"; currentVersionNumber: number; createdAt: string; updatedAt: string;
  createdBy: { id: string; firstName: string; lastName: string };
  versions: ApiAttachmentVersion[];
}
export interface ApiAttachmentOverview { canMutateAttachments: boolean; attachments: ApiAttachment[]; }

export class AttachmentsRequestError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = readStoredSession();
  if (!session) throw new AttachmentsRequestError("Your session has expired. Sign in again.", 401);
  const headers = new Headers(options.headers); headers.set("Accept", "application/json"); headers.set("Authorization", `Bearer ${session.accessToken}`);
  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers, cache: "no-store" });
  if (response.status === 401) { clearSession(); throw new AttachmentsRequestError("Your session has expired. Sign in again.", 401); }
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) throw new AttachmentsRequestError(payload?.error?.message ?? "Attachment management is unavailable. Please try again.", response.status);
  return payload.data as T;
}

export function listAttachments(documentId: string) { return request<ApiAttachmentOverview>(`/documents/${encodeURIComponent(documentId)}/attachments`); }
export function uploadAttachment(documentId: string, input: { name?: string; file: File }) {
  const body = new FormData(); body.set("file", input.file); if (input.name?.trim()) body.set("name", input.name.trim());
  return request<ApiAttachment>(`/documents/${encodeURIComponent(documentId)}/attachments`, { method: "POST", body });
}
export function uploadAttachmentVersion(attachmentId: string, file: File) {
  const body = new FormData(); body.set("file", file);
  return request<ApiAttachment>(`/attachments/${encodeURIComponent(attachmentId)}/versions`, { method: "POST", body });
}

async function fetchAttachmentFile(attachmentId: string, versionNumber: number, action: "download" | "preview"): Promise<Response> {
  const session = readStoredSession();
  if (!session) throw new AttachmentsRequestError("Your session has expired. Sign in again.", 401);
  const response = await fetch(`${apiBaseUrl}/attachments/${encodeURIComponent(attachmentId)}/versions/${versionNumber}/${action}`, { headers: { Authorization: `Bearer ${session.accessToken}` }, cache: "no-store" });
  if (response.status === 401) { clearSession(); throw new AttachmentsRequestError("Your session has expired. Sign in again.", 401); }
  if (!response.ok) { const payload = await response.json().catch(() => null); throw new AttachmentsRequestError(payload?.error?.message ?? `Attachment ${action} is unavailable.`, response.status); }
  return response;
}

export async function downloadAttachmentVersion(attachmentId: string, version: ApiAttachmentVersion): Promise<void> {
  const blobUrl = URL.createObjectURL(await (await fetchAttachmentFile(attachmentId, version.versionNumber, "download")).blob());
  const anchor = document.createElement("a"); anchor.href = blobUrl; anchor.download = version.originalFilename; anchor.click(); URL.revokeObjectURL(blobUrl);
}
export async function previewAttachmentVersion(attachmentId: string, versionNumber: number): Promise<void> {
  const blobUrl = URL.createObjectURL(await (await fetchAttachmentFile(attachmentId, versionNumber, "preview")).blob());
  const previewWindow = window.open(blobUrl, "_blank", "noopener,noreferrer");
  if (!previewWindow) { URL.revokeObjectURL(blobUrl); throw new AttachmentsRequestError("Allow pop-ups to preview this attachment.", 400); }
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
