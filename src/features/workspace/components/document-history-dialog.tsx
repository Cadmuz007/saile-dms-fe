"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, FileClock, FileText, GitBranch, Paperclip, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDocumentHistory, type ApiDocumentHistory, type ApiDocumentHistoryItem } from "@/services/documents";

interface DocumentHistoryDialogProps {
  documentId: string;
  documentTitle: string;
  onClose: () => void;
}

const actionLabels: Record<string, string> = {
  CREATED: "Created",
  VERSION_UPLOADED: "New version uploaded",
  ARCHIVED: "Archived",
  RESTORED: "Restored",
  ACCESS_GRANTED: "Access granted",
  ACCESS_REVOKED: "Access revoked",
  MOVED: "Moved",
  WORKFLOW_STARTED: "Sent to Set Sail",
  STARTED: "Workflow started",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CONVERSION_RETRIED: "PDF conversion retried",
};

const sourceLabels = { DOCUMENT: "Document", ATTACHMENT: "Attachment", WORKFLOW: "Set Sail" } as const;

function formatWhen(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function eventContext(event: ApiDocumentHistoryItem) {
  if (event.attachment) return event.attachment.name;
  if (event.workflow) return `${event.workflow.subject}${event.stageName ? ` · ${event.stageName}${event.attempt ? `, attempt ${event.attempt}` : ""}` : ""}`;
  if (event.versionNumber) return `Version ${event.versionNumber}`;
  return null;
}

function SourceIcon({ source }: { source: ApiDocumentHistoryItem["source"] }) {
  const Icon = source === "WORKFLOW" ? GitBranch : source === "ATTACHMENT" ? Paperclip : FileText;
  return <Icon aria-hidden="true" size={16} />;
}

export function DocumentHistoryDialog({ documentId, documentTitle, onClose }: DocumentHistoryDialogProps) {
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const requestKey = `${documentId}:${page}:${revision}`;
  const [result, setResult] = useState<{ key: string; history: ApiDocumentHistory | null; error: string | null } | null>(null);
  const currentResult = result?.key === requestKey ? result : null;
  const history = currentResult?.history ?? null;
  const error = currentResult?.error ?? null;
  const loading = currentResult === null;

  useEffect(() => {
    const controller = new AbortController();
    getDocumentHistory(documentId, page, controller.signal).then((data) => {
      if (!controller.signal.aborted) setResult({ key: requestKey, history: data, error: null });
    }).catch((requestError: unknown) => {
      if (!controller.signal.aborted) setResult({ key: requestKey, history: null,
        error: requestError instanceof Error ? requestError.message : "Document history could not be loaded." });
    });
    return () => controller.abort();
  }, [documentId, page, requestKey]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <section aria-describedby="document-history-description" aria-labelledby="document-history-title" aria-modal="true" className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" role="dialog">
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
        <div className="flex min-w-0 items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700"><FileClock aria-hidden="true" size={20} /></span><div className="min-w-0"><p className="text-xs font-bold tracking-[0.12em] text-violet-700 uppercase">Immutable audit timeline</p><h2 className="mt-1 truncate text-xl font-bold text-slate-950" id="document-history-title">Document History</h2><p className="mt-1 truncate text-sm text-slate-500" id="document-history-description">{documentTitle} · newest first · access and file-view noise excluded</p></div></div>
        <button autoFocus aria-label="Close document history" className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700" onClick={onClose} type="button"><X aria-hidden="true" size={19} /></button>
      </header>

      <div className="min-h-56 flex-1 overflow-y-auto p-5 sm:p-6">
        {loading ? <p aria-live="polite" className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Loading document history…</p> : null}
        {error ? <div className="grid gap-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-700" role="alert"><p>{error}</p><Button className="w-fit" onClick={() => setRevision((current) => current + 1)} size="sm" variant="secondary">Try again</Button></div> : null}
        {!loading && !error && history?.items.length === 0 ? <p className="rounded-xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">No status, content, attachment, access, or workflow events have been recorded.</p> : null}
        {!loading && !error && history?.items.length ? <ol className="relative ml-4 border-l border-violet-200">
          {history.items.map((event) => {
            const context = eventContext(event);
            return <li className="relative pb-6 pl-7 last:pb-0" key={`${event.source}:${event.id}`}>
              <span className="absolute -left-[15px] top-0 grid size-7 place-items-center rounded-full border-2 border-white bg-violet-100 text-violet-700"><SourceIcon source={event.source} /></span>
              <article className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.55)]">
                <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-bold text-slate-900">{actionLabels[event.action] ?? event.action.replaceAll("_", " ").toLowerCase()}</h3><p className="mt-0.5 text-xs text-slate-500">{event.actor.firstName} {event.actor.lastName} · {formatWhen(event.occurredAt)}</p></div><Badge tone={event.source === "WORKFLOW" ? "blue" : event.source === "ATTACHMENT" ? "amber" : "neutral"}>{sourceLabels[event.source]}</Badge></div>
                {context ? <p className="text-sm text-slate-600">{context}</p> : null}
                {event.documentTransform ? <p className="text-xs text-slate-500">Transform: {event.documentTransform.replaceAll("_", " ").toLowerCase()}</p> : null}
                {event.toStatus ? <p className="text-xs font-semibold text-slate-600">Status: {event.fromStatus ? `${event.fromStatus.replaceAll("_", " ").toLowerCase()} → ` : ""}{event.toStatus.replaceAll("_", " ").toLowerCase()}</p> : null}
                {event.reason ? <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">Reason: {event.reason}</p> : null}
              </article>
            </li>;
          })}
        </ol> : null}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:px-6">
        <p className="text-xs text-slate-500">{history ? `${history.meta.total} retained event${history.meta.total === 1 ? "" : "s"} · Page ${history.meta.page} of ${Math.max(history.meta.totalPages, 1)}` : "Authorized readers only"}</p>
        <div className="flex gap-2"><Button disabled={loading || page <= 1} onClick={() => setPage((current) => current - 1)} size="sm" variant="secondary"><ChevronLeft aria-hidden="true" size={15} />Previous</Button><Button disabled={loading || !history || page >= history.meta.totalPages} onClick={() => setPage((current) => current + 1)} size="sm" variant="secondary">Next<ChevronRight aria-hidden="true" size={15} /></Button></div>
      </footer>
    </section>
  </div>;
}
