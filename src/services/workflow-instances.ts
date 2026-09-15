import { clearSession, readStoredSession } from "@/features/auth/session-storage";
import type { StartedWorkflow, WorkflowInstanceDetail, WorkflowOptions, WorkflowRoute, WorkflowRouteDirection } from "@/features/workspace/workflow.types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class WorkflowInstancesRequestError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = readStoredSession();
  if (!session) throw new WorkflowInstancesRequestError("Your session has expired. Sign in again.", 401);
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${session.accessToken}`);
  headers.set("Content-Type", "application/json");
  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers, cache: "no-store" });
  if (response.status === 401) {
    clearSession();
    throw new WorkflowInstancesRequestError("Your session has expired. Sign in again.", 401);
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) throw new WorkflowInstancesRequestError(payload?.error?.message ?? "Set Sail is temporarily unavailable. Please try again.", response.status);
  return payload.data as T;
}

export function getWorkflowOptions(documentId: string, signal?: AbortSignal) {
  return request<WorkflowOptions>(`/documents/${encodeURIComponent(documentId)}/workflow-options`, { signal });
}

export function startWorkflow(documentId: string, input: { templateId: string; subject: string; message: string | null }) {
  return request<StartedWorkflow>(`/documents/${encodeURIComponent(documentId)}/workflows`, { method: "POST", body: JSON.stringify(input) });
}

export function listWorkflowRoutes(direction: WorkflowRouteDirection, signal?: AbortSignal) {
  return request<WorkflowRoute[]>(`/workflows?${new URLSearchParams({ direction })}`, { signal });
}

export function getWorkflowInstance(instanceId: string, signal?: AbortSignal) {
  return request<WorkflowInstanceDetail>(`/workflows/${encodeURIComponent(instanceId)}`, { signal });
}

export function submitWorkflowDecision(instanceId: string, input: { taskId: string; decision: "APPROVED" | "REJECTED"; reason: string | null; destinationFolderId?: string | null; assigneeUserId?: string }) {
  return request<{ id: string; documentId: string; duplicateDocumentId?: string | null; status: "ACTIVE" | "CANCELLED" | "COMPLETED" | "ERROR" }>(`/workflows/${encodeURIComponent(instanceId)}/decisions`, { method: "POST", body: JSON.stringify(input) });
}

export function retryWorkflowConversion(instanceId: string) {
  return request<{ id: string; documentId: string; status: "COMPLETED" | "ERROR" }>(`/workflows/${encodeURIComponent(instanceId)}/retry-conversion`, { method: "POST", body: "{}" });
}

export function markWorkflowForReview(instanceId: string, taskId: string) {
  return request<{ id: string; taskId: string; reviewStartedAt: string; reviewDueAt: string | null }>(
    `/workflows/${encodeURIComponent(instanceId)}/tasks/${encodeURIComponent(taskId)}/review`, { method: "POST", body: "{}" });
}
