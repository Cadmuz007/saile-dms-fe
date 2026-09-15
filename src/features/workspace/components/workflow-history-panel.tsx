"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, FileText, History, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { getWorkflowInstance, markWorkflowForReview, retryWorkflowConversion, submitWorkflowDecision, WorkflowInstancesRequestError } from "@/services/workflow-instances";
import { TaskSlaLabel } from "./task-sla-label";

import type { WorkflowInstanceDetail, WorkflowRoute } from "../workflow.types";

interface WorkflowHistoryPanelProps {
  route: WorkflowRoute;
  onOpenDocument: () => void;
  onSignOut: () => void;
}

const stageTone = { WAITING: "neutral", ACTIVE: "blue", COMPLETED: "green", CANCELLED: "red" } as const;
const taskTone = { WAITING: "neutral", PENDING: "amber", COMPLETED: "green", CANCELLED: "red" } as const;
const transformLabels = {
  CONVERT_TO_PDF: "Convert document to PDF",
  CONVERT_TO_PDF_AND_MOVE: "Convert document to PDF and move",
  CONVERT_TO_PDF_AND_ASSIGN: "Convert document to PDF and assign",
  MOVE_DOCUMENT: "Move document",
  DUPLICATE_AND_MOVE: "Duplicate document and move",
} as const;

function formatWhen(value: string | null): string {
  return value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Not yet";
}

function personName(person: { firstName: string; lastName: string }): string {
  return `${person.firstName} ${person.lastName}`;
}

export function WorkflowHistoryPanel({ route, onOpenDocument, onSignOut }: WorkflowHistoryPanelProps) {
  const [detail, setDetail] = useState<WorkflowInstanceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [destination, setDestination] = useState("");
  const [assignee, setAssignee] = useState("");

  async function decide(decision: "APPROVED" | "REJECTED") {
    if (!detail?.availableDecision || saving) return;
    if (decision === "APPROVED" && detail.availableDecision.requiresMove && !destination) {
      setError("Select a destination folder before approving.");
      return;
    }
    if (decision === "APPROVED" && detail.availableDecision.requiresAssign && !assignee) {
      setError("Select a user before approving and assigning the PDF.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await submitWorkflowDecision(route.id, { taskId: detail.availableDecision.taskId, decision, reason: reason || null,
        ...(decision === "APPROVED" && detail.availableDecision.requiresMove ? { destinationFolderId: destination === "root" ? null : destination } : {}),
        ...(decision === "APPROVED" && detail.availableDecision.requiresAssign ? { assigneeUserId: assignee } : {}) });
      setNotice(result.status === "ERROR" ? `PDF conversion failed. The original document is preserved${detail.availableDecision.requiresMove ? " and was not moved" : ""}; the workflow is in an error state.` : result.status === "COMPLETED" ? `${detail.availableDecision.requiresDuplicate ? "An independent copy was created and moved; the original is unchanged" : detail.availableDecision.requiresAssign ? "PDF version created and view access assigned" : detail.availableDecision.requiresPdf && detail.availableDecision.requiresMove ? "PDF version created and document moved" : detail.availableDecision.requiresPdf ? "PDF version created" : "Document moved"}; workflow completed. Your decision is retained in workflow history.` : `${decision === "APPROVED" ? "Approval" : "Rejection"} recorded. Your decision is retained in workflow history.`);
      setDetail(null);
      setReason("");
      // The actor's task may no longer confer read access after a successful response.
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Your decision could not be saved.");
      if (requestError instanceof WorkflowInstancesRequestError && requestError.status === 401) onSignOut();
    } finally {
      setSaving(false);
    }
  }

  async function retryConversion() {
    if (!detail?.conversionRetry?.canRetry || saving) return;
    setSaving(true);
    setError(null);
    try {
      const result = await retryWorkflowConversion(route.id);
      setNotice(result.status === "COMPLETED" ? `PDF conversion succeeded. A scanned immutable version was created${detail.conversionRetry.requiresMove ? " and the document was moved" : ""}; the workflow is complete.` : `PDF conversion failed again. The original document is preserved${detail.conversionRetry.requiresMove ? " and was not moved" : ""}; the failed attempt was retained in history.`);
      setRevision((value) => value + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "PDF conversion could not be retried.");
      if (requestError instanceof WorkflowInstancesRequestError && requestError.status === 401) onSignOut();
    } finally {
      setSaving(false);
    }
  }

  async function markForReview() {
    if (!detail?.availableReview || saving) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const result = await markWorkflowForReview(route.id, detail.availableReview.taskId);
      setNotice(result.reviewDueAt ? "Marked For Review. Your review deadline is now running." : "Marked For Review. This pre-rollout task remains SLA untracked.");
      setDetail(null);
      setRevision((value) => value + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not mark this task For Review.");
      if (requestError instanceof WorkflowInstancesRequestError && requestError.status === 401) onSignOut();
      setDetail(null);
      setRevision((value) => value + 1);
    } finally { setSaving(false); }
  }

  useEffect(() => {
    const controller = new AbortController();
    getWorkflowInstance(route.id, controller.signal).then((result) => {
      if (!controller.signal.aborted) setDetail(result);
    }).catch((requestError: unknown) => {
      if (controller.signal.aborted) return;
      setDetail(null);
      setError(requestError instanceof Error ? requestError.message : "Workflow history could not be loaded.");
      if (requestError instanceof WorkflowInstancesRequestError && requestError.status === 401) onSignOut();
    });
    return () => controller.abort();
  }, [onSignOut, route, revision]);

  useEffect(() => {
    const timer = window.setInterval(() => { if (!saving) setRevision((value) => value + 1); }, 60_000);
    return () => window.clearInterval(timer);
  }, [saving]);

  return (
    <section aria-labelledby="workflow-history-heading" className="grid gap-5 rounded-2xl border border-violet-200 bg-white p-5 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.55)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700"><History aria-hidden="true" size={19} /></span><div><p className="text-xs font-bold tracking-[0.12em] text-violet-700 uppercase">Immutable route history</p><h2 className="mt-1 text-xl font-bold text-slate-950" id="workflow-history-heading">{route.subject}</h2><p className="mt-1 text-sm text-slate-500">{route.template.name}, revision {route.templateRevision}</p></div></div>
        <Button onClick={onOpenDocument} variant="secondary"><FileText aria-hidden="true" size={16} />Open document</Button>
      </div>

      {!detail && !error && !notice ? <p aria-live="polite" className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Loading workflow history…</p> : null}
      {notice ? <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p> : null}
      <Button variant="secondary" disabled={saving} onClick={() => { setNotice(null); setError(null); setDetail(null); setRevision((value) => value + 1); }}>Refresh history</Button>
      {error ? <p className="rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-700" role="alert">{error}</p> : null}

      {detail ? <>
        {detail.status === "ERROR" ? <div role="alert" className="grid gap-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-800"><p>Document conversion failed. The original version is preserved.</p>{detail.conversionRetry?.canRetry ? <Button disabled={saving} onClick={() => void retryConversion()}>Retry PDF conversion</Button> : <p>{detail.conversionRetry?.blockedReason ?? "You cannot retry this conversion."}</p>}</div> : null}
        <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-3">
          <div><p className="text-xs text-slate-400">Started by</p><p className="mt-1 font-semibold text-slate-800">{personName(detail.startedBy)}</p></div>
          <div><p className="text-xs text-slate-400">Started</p><p className="mt-1 font-semibold text-slate-800">{formatWhen(detail.startedAt)}</p></div>
          <div><p className="text-xs text-slate-400">Status</p><p className="mt-1 font-semibold text-slate-800">{detail.status === "ACTIVE" ? "In progress" : detail.status === "COMPLETED" ? "Completed" : detail.status === "ERROR" ? "Conversion error" : "Cancelled"}</p></div>
        </div>
        {detail.message ? <div><p className="text-xs font-semibold text-slate-400">Routing message</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{detail.message}</p></div> : null}

        <div className="grid gap-3">
          {detail.stages.map((stage) => (
            <article className="grid gap-3 rounded-xl border border-slate-200 p-4" key={stage.id}>
              <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{stage.position + 1}</span><h3 className="font-bold text-slate-900">{stage.name} · Attempt {stage.attempt}</h3></div><Badge tone={stageTone[stage.status]}>{stage.status === "ACTIVE" ? "Active" : stage.status.charAt(0) + stage.status.slice(1).toLowerCase()}</Badge></div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span>{stage.decisionRule === "ALL" ? "All recipients required" : "Any recipient may complete"}</span><span>Opened: {formatWhen(stage.openedAt)}</span></div>
              <div className="grid gap-2 sm:grid-cols-2">
                {stage.tasks.map((task) => <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2" key={task.id}><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{personName(task.assignedUser)}</p><p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400"><Clock3 aria-hidden="true" size={12} />{formatWhen(task.receivedAt)}</p><TaskSlaLabel task={task} /></div><Badge tone={taskTone[task.status]}>{task.status === "PENDING" && task.reviewStartedAt ? "For Review" : task.status.charAt(0) + task.status.slice(1).toLowerCase()}</Badge></div>)}
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500"><CheckCircle2 aria-hidden="true" className="text-emerald-600" size={14} />Approve: {stage.approvedAction.replaceAll("_", " ").toLowerCase()}<ArrowRight aria-hidden="true" size={13} /><XCircle aria-hidden="true" className="text-rose-600" size={14} />Reject: {stage.rejectedAction.replaceAll("_", " ").toLowerCase()}</div>
              {stage.documentTransform ? <p className="text-xs text-slate-500">Transform: {transformLabels[stage.documentTransform]}</p> : null}
            </article>
          ))}
        </div>
        {detail.availableReview ? <div className="grid gap-2 rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Opening a document does not count as a response. Mark For Review when you begin reviewing; you can also approve or reject directly.</p>
          <Button variant="secondary" disabled={saving} onClick={() => void markForReview()}>For Review</Button>
        </div> : null}
        {detail.availableDecision ? <div className="grid gap-3 rounded-xl border border-violet-200 p-4">
          {detail.availableDecision.requiresMove && detail.availableDecision.moveDestinations ? <>
            <label className="text-sm font-semibold" htmlFor="workflow-move-destination">{detail.availableDecision.requiresDuplicate ? "Move copied document to" : "Move document to"}</label>
            <NativeSelect id="workflow-move-destination" disabled={saving} value={destination} onChange={(event) => setDestination(event.target.value)}>
              <NativeSelectOption value="">Select a destination folder</NativeSelectOption>
              {detail.availableDecision.moveDestinations.map((folder) => <NativeSelectOption key={folder.id ?? "root"} value={folder.id ?? "root"}>{folder.name}</NativeSelectOption>)}
            </NativeSelect>
            <p className="text-xs text-slate-500">{detail.availableDecision.requiresDuplicate ? "Final approval creates a new independent document titled with “(Copy)”, retaining the current owner and copying current primary and active attachment versions, document type, metadata, classification, subject, and description. Access grants and history are not copied; the original remains unchanged." : <>Final approval moves this document to the selected location{detail.availableDecision.requiresPdf ? " only after the new PDF version is created and scanned" : ""}. Inherited folder access may change.</>}</p>
          </> : null}
          {detail.availableDecision.requiresAssign && detail.availableDecision.assignCandidates ? <>
            <label className="text-sm font-semibold" htmlFor="workflow-assign-user">Assign PDF access to</label>
            <NativeSelect id="workflow-assign-user" disabled={saving} value={assignee} onChange={(event) => setAssignee(event.target.value)}>
              <NativeSelectOption value="">Select an active user</NativeSelectOption>
              {detail.availableDecision.assignCandidates.map((user) => <NativeSelectOption key={user.id} value={user.id}>{personName(user)} · {user.email}</NativeSelectOption>)}
            </NativeSelect>
            <p className="text-xs text-slate-500">The selected user receives view access to this document through Inbound Routes. The existing owner is retained; no license is required for assignment.</p>
          </> : null}
          <label className="text-sm font-semibold" htmlFor="workflow-decision-reason">Reason (optional)</label>
          <Textarea id="workflow-decision-reason" maxLength={4000} value={reason} disabled={saving} onChange={(event) => setReason(event.target.value)} />
          {detail.availableDecision.requiresPdf ? <p className="text-sm text-slate-600">Final approval creates a scanned PDF as a new version and preserves the original. Conversion may take a moment.</p> : null}
          <p className="text-xs text-slate-500">Your response and time will be recorded permanently. The stage follows its configured outcome when resolved.</p>
          <div className="flex gap-3"><Button disabled={saving || Boolean(detail.availableDecision.approveBlockedReason)} onClick={() => void decide("APPROVED")}>Approve</Button><Button variant="secondary" disabled={saving || Boolean(detail.availableDecision.rejectBlockedReason)} onClick={() => void decide("REJECTED")}>Reject</Button></div>
          {detail.availableDecision.approveBlockedReason ? <p className="text-sm text-slate-600">Approve: {detail.availableDecision.approveBlockedReason}</p> : null}
          {detail.availableDecision.rejectBlockedReason ? <p className="text-sm text-slate-600">Reject: {detail.availableDecision.rejectBlockedReason}</p> : null}
        </div> : null}
        <div className="grid gap-2" aria-label="Decision history">{detail.auditEvents.slice().reverse().map((event) => <article key={event.id} className="rounded-xl bg-slate-50 p-3 text-sm">
          <p className="font-semibold">{event.action} · {personName(event.actor)}</p><p className="text-xs text-slate-500">{formatWhen(event.occurredAt)}</p>
          {event.decision?.transformStatus ? <p>PDF conversion: {event.decision.transformStatus === "ERROR" ? "Failed — original preserved" : "Completed"}</p> : null}
          {event.decision?.moveStatus ? <p>Document move: {event.decision.moveStatus === "COMPLETED" ? "Completed" : "Pending PDF recovery"}</p> : null}
          {event.decision?.duplicateDocumentId ? <p>Created copy {event.decision.duplicateDocumentId} with {event.decision.copiedAttachmentCount ?? 0} active attachment{event.decision.copiedAttachmentCount === 1 ? "" : "s"}</p> : null}
          {event.decision?.assigneeUserId ? <p>Assigned view access to user {event.decision.assigneeUserId}</p> : null}
          {event.retry ? <p>PDF recovery: {event.retry.transformStatus === "ERROR" ? `Failed again from version ${event.retry.sourceVersionNumber} — original preserved${event.retry.moveStatus ? ", move still pending" : ""}` : `Completed from version ${event.retry.sourceVersionNumber} as version ${event.retry.outputVersionNumber}${event.retry.moveStatus ? ", document moved" : ""}`}</p> : null}
          {event.decision ? <><p>{event.decision.stageName} · Attempt {event.decision.attempt} · Document version {event.decision.documentVersionNumber}</p><p>{event.decision.resolved ? `Stage resolved: ${event.decision.selectedAction.replaceAll("_", " ").toLowerCase()}` : "Waiting for remaining recipients"}</p>{event.decision.reason ? <p className="whitespace-pre-wrap">Reason: {event.decision.reason}</p> : null}</> : null}
        </article>)}</div>
      </> : null}
    </section>
  );
}
