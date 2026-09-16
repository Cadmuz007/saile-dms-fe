import { clearSession, readStoredSession } from "@/features/auth/session-storage";
export const uploadFileTypes = ["PDF", "DOCX", "XLSX", "PPTX", "TXT", "CSV", "PNG", "JPEG"] as const;
export interface FileTypeConfiguration { allowedTypes: (typeof uploadFileTypes[number])[]; }
export interface FileTypePolicyRevision { id: string | null; revision: number; configuration: FileTypeConfiguration; createdAt: string | null; actor: { id: string; firstName: string; lastName: string } | null; }
export interface FileTypePolicySettings { current: FileTypePolicyRevision; history: FileTypePolicyRevision[]; }
export class FileTypePolicyRequestError extends Error { constructor(message: string, readonly status: number) { super(message); } }
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
async function request<T>(options: RequestInit = {}): Promise<T> {
  const session = readStoredSession();
  if (!session) throw new FileTypePolicyRequestError("Your session has expired. Sign in again.", 401);
  const response = await fetch(`${apiBaseUrl}/admin/file-type-policy`, { ...options, cache: "no-store", headers: {
    Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}`,
  } });
  if (response.status === 401) { clearSession(); throw new FileTypePolicyRequestError("Your session has expired. Sign in again.", 401); }
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) throw new FileTypePolicyRequestError(payload?.error?.message ?? "FileType policy settings are unavailable.", response.status);
  return payload.data as T;
}
export const getFileTypePolicySettings = (signal?: AbortSignal) => request<FileTypePolicySettings>({ signal });
export const saveFileTypePolicySettings = (expectedRevision: number, configuration: FileTypeConfiguration) => request<FileTypePolicyRevision>({ method: "PUT", body: JSON.stringify({ expectedRevision, configuration }) });
