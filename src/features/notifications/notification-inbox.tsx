"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { listNotifications, NotificationsRequestError, setNotificationRead, type NotificationPage } from "@/services/notifications";
import { subscribeToWorkspaceChanges } from "@/services/workspace-realtime";

const kindLabels = { ASSIGNMENT: "Assigned to you", RESPONSE_REMINDER: "Response overdue", REVIEW_REMINDER: "Review overdue" };
const when = (value: string) => new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value));

export function NotificationInbox({ onSignOut, onOpenRoutes }: { onSignOut: () => void; onOpenRoutes: () => void }) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<NotificationPage | null>(null);
  const [unread, setUnread] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    listNotifications(open ? page : 1, open ? 25 : 1, controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      setData(result); setUnread(result.meta.unread); setError(null);
    }).catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      setData(null); setUnread(null); setError(cause instanceof Error ? cause.message : "Notifications could not be loaded.");
      if (cause instanceof NotificationsRequestError && cause.status === 401) onSignOut();
    });
    return () => controller.abort();
  }, [open, page, revision, onSignOut]);
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    const clear = () => { setData(null); setUnread(null); refresh(); };
    const unsubscribe = subscribeToWorkspaceChanges(refresh, clear);
    const timer = window.setInterval(refresh, 60_000);
    return () => { unsubscribe(); window.clearInterval(timer); };
  }, []);
  async function mark(id: string, isRead: boolean) {
    setBusy(id); setError(null);
    try { await setNotificationRead(id, isRead); setData(null); setRevision((value) => value + 1); }
    catch (cause) {
      setData(null); setUnread(null);
      setError(cause instanceof Error ? cause.message : "Read status could not be saved.");
      if (cause instanceof NotificationsRequestError && cause.status === 401) onSignOut();
    } finally { setBusy(null); }
  }
  return <>
    <button type="button" aria-label={unread === null ? "Notifications" : `Notifications, ${unread} unread`} title="Notifications"
      className="relative grid size-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-violet-700"
      onClick={() => { setPage(1); setData(null); setOpen(true); }}>
      <Bell aria-hidden="true" size={18} />
      {unread !== null && unread > 0 ? <span className="absolute -top-1 -right-1 rounded-full bg-violet-700 px-1 text-[10px] font-bold text-white">{unread > 99 ? "99+" : unread}</span> : null}
    </button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>Notifications</DialogTitle><DialogDescription>Workflow assignments and SLA reminders. Delivery and read times are shown in Philippine time.</DialogDescription></DialogHeader>
        <div className="flex flex-wrap items-center gap-2"><Button variant="secondary" onClick={() => { setData(null); setRevision((value) => value + 1); }}>Refresh notifications</Button><Button variant="secondary" onClick={() => { setOpen(false); onOpenRoutes(); }}>Open Routes</Button>{unread !== null ? <span className="text-sm">{unread} unread</span> : null}</div>
        {error ? <p role="alert" className="text-sm text-rose-700">{error}</p> : null}
        {!data && !error ? <p role="status" className="text-sm">Loading notifications…</p> : null}
        {data?.items.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">No notifications on this page.</p> : null}
        <div className="grid gap-3">{data?.items.map((item) => <article key={item.id} className={`grid gap-2 rounded-md border p-3 ${item.readAt ? "border-slate-200" : "border-violet-200 bg-violet-50/40"}`}>
          <div className="flex items-start justify-between gap-2"><div><p className="text-xs font-semibold text-violet-700">{kindLabels[item.kind]} · {item.readAt ? "Read" : "Unread"}</p><h3 className="text-sm font-semibold break-words">{item.document.title}</h3></div><Button size="sm" variant="secondary" disabled={busy !== null} onClick={() => void mark(item.id, !item.readAt)}>{busy === item.id ? "Saving…" : item.readAt ? "Mark unread" : "Mark read"}</Button></div>
          <p className="text-xs text-slate-600">{item.stageName} · Attempt {item.attempt}{item.taskStatus !== "PENDING" ? ` · Task ${item.taskStatus.toLowerCase()}` : ""}</p>
          <p className="text-xs text-slate-500">Delivered to inbox {when(item.deliveredAt)} PHT</p>
          <details className="text-xs text-slate-600"><summary className="cursor-pointer font-medium">Delivery and read history</summary><ul className="mt-2 grid gap-1"><li>Scheduled: {when(item.scheduledAt)} PHT</li><li>Delivered to inbox: {when(item.deliveredAt)} PHT</li>{item.readEvents.map((event) => <li key={event.id}>You marked {event.isRead ? "read" : "unread"}: {when(event.occurredAt)} PHT</li>)}</ul>{item.readEvents.length === 20 ? <p>Showing the latest 20 read changes.</p> : null}</details>
        </article>)}</div>
        {data ? <div className="flex items-center justify-between gap-2"><Button variant="secondary" disabled={page === 1 || busy !== null} onClick={() => { setData(null); setPage(page - 1); }}>Previous</Button><span className="text-xs">Page {page} of {Math.max(1, data.meta.totalPages)}</span><Button variant="secondary" disabled={page >= data.meta.totalPages || busy !== null} onClick={() => { setData(null); setPage(page + 1); }}>Next</Button></div> : null}
      </DialogContent>
    </Dialog>
  </>;
}
