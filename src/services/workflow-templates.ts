import { clearSession, readStoredSession } from "@/features/auth/session-storage";
import type {
  ManagedWorkflowTemplate,
  WorkflowRecipientCandidates,
  WorkflowTemplateInput,
  WorkflowTemplatesResult,
} from "@/features/admin/workflow-templates.types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class WorkflowTemplatesRequestError extends Error {
  constructor(message: string, readonly status: number, readonly fields: Record<string, string> = {}) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}) {
  const session = readStoredSession();
  if (!session) throw new WorkflowTemplatesRequestError("Your session has expired. Sign in again.", 401);
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${session.accessToken}`);
  headers.set("Content-Type", "application/json");
  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers, cache: "no-store" });
  if (response.status === 401) {
    clearSession();
    throw new WorkflowTemplatesRequestError("Your session has expired. Sign in again.", 401);
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    const fields = Object.fromEntries((payload?.error?.details ?? []).map((item: { field: string; message: string }) => [item.field, item.message]));
    throw new WorkflowTemplatesRequestError(payload?.error?.message ?? "Set Sail workflow management is unavailable. Please try again.", response.status, fields);
  }
  return payload as { data: T; meta?: WorkflowTemplatesResult["meta"] };
}

export async function listWorkflowTemplates(query: Record<string, string>, signal: AbortSignal): Promise<WorkflowTemplatesResult> {
  const result = await request<ManagedWorkflowTemplate[]>(`/admin/set-sail/templates?${new URLSearchParams(query)}`, { signal });
  return { data: result.data, meta: result.meta! };
}

export async function listWorkflowRecipientCandidates(signal?: AbortSignal): Promise<WorkflowRecipientCandidates> {
  return (await request<WorkflowRecipientCandidates>("/admin/set-sail/recipient-candidates?limit=100", { signal })).data;
}

export async function createWorkflowTemplate(input: WorkflowTemplateInput) {
  return (await request<ManagedWorkflowTemplate>("/admin/set-sail/templates", {
    method: "POST",
    body: JSON.stringify(input),
  })).data;
}

export async function updateWorkflowTemplate(id: string, expectedRevision: number, input: WorkflowTemplateInput) {
  return (await request<ManagedWorkflowTemplate>(`/admin/set-sail/templates/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ ...input, expectedRevision }),
  })).data;
}

export async function archiveWorkflowTemplate(id: string) {
  return (await request<ManagedWorkflowTemplate>(`/admin/set-sail/templates/${encodeURIComponent(id)}/archive`, {
    method: "POST",
    body: "{}",
  })).data;
}
