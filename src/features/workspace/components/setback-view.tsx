"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { listSetback, WorkflowInstancesRequestError, type SetbackPage } from "@/services/workflow-instances";
import { subscribeToWorkspaceChanges } from "@/services/workspace-realtime";
import { WorkflowHistoryPanel } from "./workflow-history-panel";
import type { WorkflowRouteDirection } from "../workflow.types";

export function SetbackView({ onSignOut }: { onSignOut: () => void }) {
  const [direction, setDirection] = useState<WorkflowRouteDirection>("INBOUND");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<SetbackPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    listSetback(direction, page, controller.signal).then((result) => {
      if (!controller.signal.aborted) { setData(result); setError(null); }
    }).catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      setData(null); setSelected(null);
      setError(cause instanceof Error ? cause.message : "Setback could not be loaded.");
      if (cause instanceof WorkflowInstancesRequestError && cause.status === 401) onSignOut();
    });
    return () => controller.abort();
  }, [direction, page, revision, onSignOut]);
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    const clear = () => { setData(null); setSelected(null); refresh(); };
    const unsubscribe = subscribeToWorkspaceChanges(refresh, clear);
    const timer = window.setInterval(refresh, 60_000);
    return () => { unsubscribe(); window.clearInterval(timer); };
  }, []);
  const item = data?.items.find((task) => task.id === selected);
  const when = (value: string) => new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value));
  return <section className="grid gap-4" aria-label="Setback overdue tasks">
    <div><h2 className="text-xl font-bold">Setback</h2><p className="text-sm text-slate-600">Overdue responses and reviews, using each task’s business calendar.</p></div>
    <p className="text-sm text-slate-500">In-app reminders appear in your notification inbox for eligible new tasks. Email and SMS delivery are not configured yet.</p>
    <div className="flex flex-wrap gap-2">
      {(["INBOUND", "OUTBOUND"] as const).map((value) => <Button key={value} variant={direction === value ? "default" : "secondary"} aria-pressed={direction === value} onClick={() => { setDirection(value); setPage(1); setData(null); setSelected(null); }}>{value === "INBOUND" ? "My overdue tasks" : "My outbound workflows"}</Button>)}
      <Button variant="secondary" onClick={() => { setData(null); setSelected(null); setRevision((value) => value + 1); }}>Refresh Setback</Button>
    </div>
    {error ? <p role="alert" className="text-sm text-rose-700">{error}</p> : !data ? <p role="status">Loading overdue tasks…</p> : <>
      <p role="status" className="text-sm text-slate-600">{data.meta.total} overdue tasks · Checked {when(data.meta.evaluatedAt)} PHT</p>
      {!data.items.length ? <p className="rounded-md border border-slate-200 bg-white p-5">No overdue tasks on this page.</p> : <div className="grid gap-2">{data.items.map((task) => <button type="button" key={task.id} aria-pressed={selected === task.id} onClick={() => setSelected(task.id)} className="grid gap-1 rounded-md border border-rose-200 bg-white p-4 text-left hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-violet-700">
        <span className="font-semibold">{task.workflow.document.title}</span>
        <span className="text-sm text-slate-600">{task.assignedUser.firstName} {task.assignedUser.lastName} · {task.stage.name} · Attempt {task.stage.attempt}</span>
        <span className="text-sm font-semibold text-rose-700">Overdue {task.sla.phase === "REVIEW" ? "review" : "response"} · Due {when(task.sla.dueAt)} PHT</span>
        {task.reminder ? <span className="text-xs text-slate-600">Reminder every {task.reminder.intervalHours} business hours · Next scheduled: {when(task.reminder.nextDueAt)} PHT · {task.reminder.deliveryEnabled ? "In-app delivery enabled" : "In-app delivery not enabled for this task"}</span> : null}
        <span className="text-xs text-violet-700">Open workflow history and actions</span>
      </button>)}</div>}
      <div className="flex items-center gap-3"><Button variant="secondary" disabled={page === 1} onClick={() => { setPage(page - 1); setData(null); setSelected(null); }}>Previous</Button><span className="text-sm">Page {page} of {Math.max(1, data.meta.totalPages)}</span><Button variant="secondary" disabled={page >= data.meta.totalPages} onClick={() => { setPage(page + 1); setData(null); setSelected(null); }}>Next</Button></div>
    </>}
    {item ? <WorkflowHistoryPanel key={item.id} route={item.workflow} onSignOut={onSignOut} /> : null}
  </section>;
}
