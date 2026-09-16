import { clearSession, readStoredSession } from "@/features/auth/session-storage";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
export class NotificationsRequestError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}
export interface InboxNotification {
  id: string;
  kind: "ASSIGNMENT" | "RESPONSE_REMINDER" | "REVIEW_REMINDER";
  scheduledAt: string;
  deliveredAt: string;
  readAt: string | null;
  document: { id: string; title: string };
  workflowId: string;
  taskStatus: string;
  stageName: string;
  attempt: number;
  readEvents: Array<{ id: string; isRead: boolean; occurredAt: string }>;
}
export interface NotificationPage { items: InboxNotification[]; meta: { total: number; unread: number; page: number; pageSize: number; totalPages: number } }
async function request(path: string, options: RequestInit = {}) {
  const session = readStoredSession();
  if (!session) throw new NotificationsRequestError("Sign in to view notifications.", 401);
  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, cache: "no-store",
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` } });
  if (response.status === 401) { clearSession(); throw new NotificationsRequestError("Your session expired. Sign in again.", 401); }
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) throw new NotificationsRequestError(payload?.error?.message ?? "Notifications are unavailable.", response.status);
  return payload;
}
export async function listNotifications(page: number, pageSize: number, signal?: AbortSignal): Promise<NotificationPage> {
  const payload = await request(`/notifications?${new URLSearchParams({ page: String(page), pageSize: String(pageSize) })}`, { signal });
  return { items: payload.data, meta: payload.meta };
}
export async function setNotificationRead(id: string, isRead: boolean): Promise<void> {
  await request(`/notifications/${encodeURIComponent(id)}/read`, { method: "POST", body: JSON.stringify({ isRead }) });
}
