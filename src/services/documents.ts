import { clearSession, readStoredSession } from "@/features/auth/session-storage";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export type ApiLibraryArea = "HOME" | "PRIVATE" | "PUBLIC";
export interface StorageUsage { usedBytes: string; limitBytes: string; blockOverQuota: boolean; uploadsBlocked: boolean; }
export function getStorageUsage(signal?: AbortSignal) { return request<StorageUsage>("/storage/usage", { signal }); }
export interface ApiFolder {
  id: string; name: string; area: ApiLibraryArea; parentId: string | null; ownerUserId: string; archivedAt: string | null; archivedByFolderId: string | null; createdAt: string; updatedAt: string;
  canMove?: boolean; canArchive?: boolean; canRestore?: boolean; _count: { documents: number };
}
export interface ApiDocument {
  id: string; title: string; subject: string | null; description: string | null; classification: "CLASSIFIED" | "UNCLASSIFIED";
  status: "ACTIVE" | "ARCHIVED"; area: ApiLibraryArea; folderId: string | null; ownerUserId: string; currentVersionNumber: number;
  canMove?: boolean; canArchive?: boolean; canRestore?: boolean; canStartWorkflow?: boolean;
  archivedAt: string | null; archivedByFolderId: string | null; createdAt: string; updatedAt: string;
  documentTypeId: string | null; documentType: { id: string; name: string } | null;
  metadataValues: Array<{
    shortTextValue: string | null; longTextValue: string | null; dateValue: string | null; selectedOptionValue: string | null;
    field: { id: string; label: string; kind: "SHORT_TEXT" | "LONG_TEXT" | "DATE" | "SINGLE_SELECT"; position: number };
  }>;
  versions: Array<{ originalFilename: string; detectedMimeType: string; byteSize: number; uploadedAt: string; uploadedBy: { firstName: string; lastName: string } }>;
  barcodes: Array<{ id: string; barcodeValue: string; revision: number; generatedAt: string }>;
}
export interface ApiBarcodeActor { id: string; firstName: string; lastName: string; }
export interface ApiBarcodePrintEvent { id: string; actionType: "PRINT_BARCODE" | "REPRINT_BARCODE"; copies: number; occurredAt: string; performedBy: ApiBarcodeActor; }
export interface ApiBarcode { id: string; barcodeValue: string; symbology: string; titleSnapshot: string; revision: number; isCurrent?: boolean; generatedAt: string; retiredAt?: string | null; generatedBy?: ApiBarcodeActor; printEvents?: ApiBarcodePrintEvent[]; }
export interface ApiBarcodeOverview { id: string; title: string; barcodes: ApiBarcode[]; printEvents: (Omit<ApiBarcodePrintEvent, "actionType"> & { actionType: "PRINT_DOCUMENT"; documentVersion: number | null })[]; }
export interface ApiBarcodePrintReceipt { document: { id: string; title: string }; barcode: ApiBarcode; event: ApiBarcodePrintEvent; }
export interface ApiBarcodeManagerRow { id: string; title: string; area: ApiLibraryArea; folder: { id: string; name: string } | null; owner: ApiBarcodeActor; barcodes: ApiBarcode[]; }
export type ApiAccessLevel = "READ" | "EDIT";
export type ApiAccessTargetType = "USER" | "GROUP";
export interface ApiAccessGrant {
  id: string; accessLevel: ApiAccessLevel; grantedAt: string; revokedAt: string | null;
  user: { id: string; firstName: string; lastName: string; email: string } | null;
  group: { id: string; name: string; _count: { memberships: number } } | null;
  grantedBy: { id: string; firstName: string; lastName: string };
}
export interface ApiAccessOverview {
  grants: ApiAccessGrant[];
  candidates: {
    users: Array<{ id: string; firstName: string; lastName: string; email: string }>;
    groups: Array<{ id: string; name: string; _count: { memberships: number } }>;
  };
}
export interface ApiDocumentVersion {
  id: string; versionNumber: number; originalFilename: string; detectedMimeType: string; byteSize: number; uploadedAt: string;
  uploadedBy: { id: string; firstName: string; lastName: string };
}
export interface ApiVersionOverview {
  currentVersionNumber: number;
  canUploadVersion: boolean;
  versions: ApiDocumentVersion[];
}
export interface ApiDocumentHistoryItem {
  id: string;
  source: "DOCUMENT" | "ATTACHMENT" | "WORKFLOW";
  action: string;
  occurredAt: string;
  actor: { id: string; firstName: string; lastName: string };
  versionNumber: number | null;
  reason: string | null;
  attachment: { id: string; name: string } | null;
  workflow: { id: string; subject: string } | null;
  stageName: string | null;
  attempt: number | null;
  documentTransform: string | null;
  fromStatus: string | null;
  toStatus: string | null;
}
export interface ApiDocumentHistory {
  document: { id: string; title: string; status: "ACTIVE" | "ARCHIVED"; currentVersionNumber: number };
  items: ApiDocumentHistoryItem[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}
export interface ApiArchiveOverview { folders: ApiFolder[]; documents: ApiDocument[]; }

export class DocumentsRequestError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = readStoredSession();
  if (!session) throw new DocumentsRequestError("Your session has expired. Sign in again.", 401);
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${session.accessToken}`);
  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers, cache: "no-store" });
  if (response.status === 401) { clearSession(); throw new DocumentsRequestError("Your session has expired. Sign in again.", 401); }
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) throw new DocumentsRequestError(payload?.error?.message ?? "Document management is unavailable. Please try again.", response.status);
  return payload.data as T;
}

export function listFolders(area: ApiLibraryArea, signal?: AbortSignal, tree = false) { return request<ApiFolder[]>(`/folders?${new URLSearchParams({ area, ...(tree ? { tree: "true" } : {}) })}`, { signal }); }
export function listDocuments(area: ApiLibraryArea, signal?: AbortSignal, all = false) { return request<ApiDocument[]>(`/documents?${new URLSearchParams({ area, ...(all ? { all: "true" } : {}) })}`, { signal }); }
export function getDocument(id: string, signal?: AbortSignal) { return request<ApiDocument>(`/documents/${encodeURIComponent(id)}`, { signal }); }
export function createFolder(input: { name: string; area: ApiLibraryArea; parentId?: string }) { return request<ApiFolder>("/folders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }); }
export function moveFolder(folderId: string, parentId: string | null) { return request<ApiFolder>(`/folders/${encodeURIComponent(folderId)}/move`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ parentId }) }); }
export function moveDocument(documentId: string, folderId: string | null) { return request<ApiDocument>(`/documents/${encodeURIComponent(documentId)}/move`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folderId }) }); }
export function listArchivedResources(signal?: AbortSignal) { return request<ApiArchiveOverview>("/archives", { signal }); }
export function archiveFolder(folderId: string) { return request<ApiFolder>(`/folders/${encodeURIComponent(folderId)}/archive`, { method: "POST" }); }
export function restoreFolder(folderId: string) { return request<ApiFolder>(`/folders/${encodeURIComponent(folderId)}/restore`, { method: "POST" }); }
export function archiveDocument(documentId: string) { return request<ApiDocument>(`/documents/${encodeURIComponent(documentId)}/archive`, { method: "POST" }); }
export function restoreDocument(documentId: string) { return request<ApiDocument>(`/documents/${encodeURIComponent(documentId)}/restore`, { method: "POST" }); }
export function uploadDocument(input: { title: string; area: ApiLibraryArea; folderId?: string; classification: "CLASSIFIED" | "UNCLASSIFIED"; documentTypeId?: string; metadata: Array<{ fieldId: string; value: string }>; file: File }) {
  const body = new FormData();
  body.set("title", input.title); body.set("area", input.area); body.set("classification", input.classification); body.set("file", input.file);
  if (input.documentTypeId) body.set("documentTypeId", input.documentTypeId);
  if (input.folderId) body.set("folderId", input.folderId);
  body.set("metadata", JSON.stringify(input.metadata));
  return request<ApiDocument>("/documents", { method: "POST", body });
}

export type AccessResourceKind = "documents" | "folders";
export function getResourceAccess(kind: AccessResourceKind, resourceId: string) { return request<ApiAccessOverview>(`/${kind}/${encodeURIComponent(resourceId)}/access`); }
export function grantResourceAccess(kind: AccessResourceKind, resourceId: string, input: { targetType: ApiAccessTargetType; targetId: string; accessLevel: ApiAccessLevel }) { return request<ApiAccessGrant>(`/${kind}/${encodeURIComponent(resourceId)}/access-grants`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }); }
export function revokeResourceAccess(kind: AccessResourceKind, resourceId: string, grantId: string) { return request<ApiAccessGrant>(`/${kind}/${encodeURIComponent(resourceId)}/access-grants/${encodeURIComponent(grantId)}/revoke`, { method: "POST" }); }
export function listDocumentVersions(documentId: string) { return request<ApiVersionOverview>(`/documents/${encodeURIComponent(documentId)}/versions`); }
export function getDocumentHistory(documentId: string, page = 1, signal?: AbortSignal) {
  return request<ApiDocumentHistory>(`/documents/${encodeURIComponent(documentId)}/history?${new URLSearchParams({ page: String(page), pageSize: "20" })}`, { signal });
}
export function uploadDocumentVersion(documentId: string, file: File) {
  const body = new FormData();
  body.set("file", file);
  return request<ApiDocument>(`/documents/${encodeURIComponent(documentId)}/versions`, { method: "POST", body });
}
export function getDocumentBarcode(documentId: string) { return request<ApiBarcodeOverview>(`/documents/${encodeURIComponent(documentId)}/barcode`); }
export function listBarcodes(signal?: AbortSignal) { return request<ApiBarcodeManagerRow[]>("/barcodes", { signal }); }
export function generateDocumentBarcode(documentId: string, expectedRevision: number) { return request<ApiBarcode>(`/documents/${encodeURIComponent(documentId)}/barcode`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expectedRevision }) }); }
export function printGeneratedBarcode(documentId: string, expectedRevision: number) { return request<ApiBarcodePrintReceipt>(`/documents/${encodeURIComponent(documentId)}/barcode/print`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expectedRevision }) }); }
export function reprintDocumentBarcode(documentId: string, expectedRevision: number, copies = 3) { return request<ApiBarcodePrintReceipt>(`/documents/${encodeURIComponent(documentId)}/barcode/reprint`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ copies, expectedRevision }) }); }

export async function printDocument(documentId: string): Promise<Blob> {
  const session = readStoredSession();
  if (!session) throw new DocumentsRequestError("Your session has expired. Sign in again.", 401);
  const response = await fetch(`${apiBaseUrl}/documents/${encodeURIComponent(documentId)}/print`, { method: "POST", headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" }, body: "{}", cache: "no-store" });
  if (response.status === 401) { clearSession(); throw new DocumentsRequestError("Your session has expired. Sign in again.", 401); }
  if (!response.ok) { const payload = await response.json().catch(() => null); throw new DocumentsRequestError(payload?.error?.message ?? "Document printing is unavailable.", response.status); }
  return response.blob();
}

export async function fetchDocumentPreview(documentId: string): Promise<Blob> {
  const session = readStoredSession();
  if (!session) throw new DocumentsRequestError("Your session has expired. Sign in again.", 401);
  const response = await fetch(`${apiBaseUrl}/documents/${encodeURIComponent(documentId)}/preview`, { headers: { Authorization: `Bearer ${session.accessToken}` }, cache: "no-store" });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new DocumentsRequestError(payload?.error?.message ?? "Preview is unavailable.", response.status);
  }
  return response.blob();
}

async function downloadFile(path: string, fallbackFilename: string): Promise<void> {
  const session = readStoredSession();
  if (!session) throw new DocumentsRequestError("Your session has expired. Sign in again.", 401);
  const response = await fetch(`${apiBaseUrl}${path}`, { headers: { Authorization: `Bearer ${session.accessToken}` }, cache: "no-store" });
  if (response.status === 401) { clearSession(); throw new DocumentsRequestError("Your session has expired. Sign in again.", 401); }
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new DocumentsRequestError(payload?.error?.message ?? "Download is unavailable.", response.status);
  }
  const blobUrl = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = blobUrl; anchor.download = fallbackFilename; anchor.click();
  URL.revokeObjectURL(blobUrl);
}

export function downloadDocument(documentId: string, fallbackFilename: string) { return downloadFile(`/documents/${encodeURIComponent(documentId)}/download`, fallbackFilename); }
export function downloadDocumentVersion(documentId: string, versionNumber: number, fallbackFilename: string) { return downloadFile(`/documents/${encodeURIComponent(documentId)}/versions/${versionNumber}/download`, fallbackFilename); }
