"use client";

import { Sailboat, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { getWorkflowOptions, startWorkflow, WorkflowInstancesRequestError } from "@/services/workflow-instances";
import type { WorkflowOptions } from "../workflow.types";

interface SetSailTarget { id: string; title: string; subject: string; }

interface SetSailDialogProps {
  target: SetSailTarget | null;
  onClose: () => void;
  onSignOut: () => void;
  onStarted: (message: string) => void;
}

export function SetSailDialog({ target, onClose, onSignOut, onStarted }: SetSailDialogProps) {
  const [options, setOptions] = useState<WorkflowOptions | null>(null);
  const [templateId, setTemplateId] = useState("");
  const [subject, setSubject] = useState(target?.subject || target?.title || "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(Boolean(target));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    const controller = new AbortController();
    getWorkflowOptions(target.id, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setOptions(result);
        const assigned = result.templates.filter((template) => template.isAssignedToDocumentType);
        if (assigned.length === 1) setTemplateId(assigned[0].id);
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        setError(requestError instanceof Error ? requestError.message : "Set Sail options could not be loaded.");
        if (requestError instanceof WorkflowInstancesRequestError && requestError.status === 401) onSignOut();
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [onSignOut, target]);

  const selected = useMemo(() => options?.templates.find((template) => template.id === templateId), [options, templateId]);

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!target || !templateId || !subject.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const instance = await startWorkflow(target.id, { templateId, subject: subject.trim(), message: message.trim() || null });
      onStarted(`Set Sail started with ${instance.template.name}. Stage 1 tasks are now pending.`);
      onClose();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The workflow could not be started.");
      if (requestError instanceof WorkflowInstancesRequestError && requestError.status === 401) onSignOut();
    } finally {
      setSubmitting(false);
    }
  }

  if (!target) return null;

  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm" role="presentation">
    <section aria-describedby="set-sail-description" aria-labelledby="set-sail-title" aria-modal="true" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl" role="dialog">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6"><div><p className="text-xs font-bold tracking-[0.12em] text-fuchsia-700 uppercase">Document routing</p><h2 className="mt-1 text-xl font-bold text-slate-950" id="set-sail-title">Set Sail for {target.title}</h2><p className="mt-1 text-sm text-slate-500" id="set-sail-description">Choose a published workflow. Its current configuration and recipients will be snapshotted when routing starts.</p></div><button aria-label="Close Set Sail dialog" className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700" disabled={submitting} onClick={onClose} type="button"><X aria-hidden="true" size={19} /></button></div>
      <form className="grid gap-5 p-5 sm:p-6" onSubmit={(event) => void submit(event)}>
        {loading ? <p className="text-sm text-slate-500">Loading published workflows…</p> : null}
        {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700" role="alert">{error}</p> : null}
        {options?.activeInstance ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">This document already has {options.activeInstance.status === "ERROR" ? "a workflow with a conversion error" : "an active workflow"}: <strong>{options.activeInstance.template.name}</strong>, started {new Date(options.activeInstance.startedAt).toLocaleString()}.</div> : null}
        {!loading && options && !options.activeInstance && options.templates.length === 0 ? <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-600">No published Set Sail templates are currently available.</p> : null}
        {!options?.activeInstance && options?.templates.length ? <>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-800">Published workflow<select className="h-11 rounded-xl border border-slate-200 bg-white px-3 font-normal text-slate-800 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100" disabled={submitting} onChange={(event) => setTemplateId(event.target.value)} required value={templateId}><option value="">Select a workflow</option>{options.templates.map((template) => <option key={template.id} value={template.id}>{template.isAssignedToDocumentType ? "Assigned automatically — " : ""}{template.name} (revision {template.configurationRevision})</option>)}</select></label>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-800">Subject<input className="h-11 rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100" disabled={submitting} maxLength={300} onChange={(event) => setSubject(event.target.value)} required value={subject} /></label>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-800">Message<textarea className="min-h-24 rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100" disabled={submitting} maxLength={4000} onChange={(event) => setMessage(event.target.value)} value={message} /></label>
          {selected ? <div className="grid gap-2 rounded-xl bg-slate-50 p-4"><p className="text-sm font-bold text-slate-900">{selected.stages.length} sequential {selected.stages.length === 1 ? "stage" : "stages"}</p>{selected.stages.map((stage) => <div className="flex items-center justify-between gap-3 text-xs text-slate-600" key={stage.id}><span>{stage.position + 1}. {stage.name}</span><span>{stage.decisionRule === "ALL" ? "All recipients" : "Any recipient"} · {stage.recipients.length} configured</span></div>)}</div> : null}
          <p className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-800">Starting creates an immutable execution snapshot and opens stage 1. Approve/reject actions remain unavailable while the remaining runtime parameters are finalized.</p>
        </> : null}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><Button disabled={submitting} onClick={onClose} type="button" variant="secondary">Cancel</Button><Button disabled={loading || submitting || !templateId || !subject.trim() || Boolean(options?.activeInstance)} type="submit"><Sailboat aria-hidden="true" size={16} />{submitting ? "Starting…" : "Start Set Sail"}</Button></div>
      </form>
    </section>
  </div>;
}
