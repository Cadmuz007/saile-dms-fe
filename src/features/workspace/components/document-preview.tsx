import { Barcode, Check, Eye, Printer, Sailboat, Send, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { MockDocument, RouteStatus } from "../types";

interface DocumentPreviewProps {
  document: MockDocument;
  onAction: (action: string) => void;
  onDecision: (documentId: string, status: RouteStatus) => void;
}

const statusTone: Record<RouteStatus, "amber" | "blue" | "green" | "red"> = {
  Pending: "amber",
  Review: "blue",
  Completed: "green",
  Setback: "red",
};

const actionItems = [
  { label: "Set Sail", icon: Sailboat },
  { label: "Send", icon: Send },
  { label: "Print", icon: Printer },
  { label: "Barcode", icon: Barcode },
];

export function DocumentPreview({ document, onAction, onDecision }: DocumentPreviewProps) {
  const needsReview = document.status === "Review" || document.status === "Pending";

  return (
    <aside aria-label="Document preview and approval" className="grid h-full content-start gap-5 overflow-y-auto bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.09),transparent_14rem)] p-5">
      <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="text-xs font-semibold text-slate-500">Status</span>{document.status ? <Badge tone={statusTone[document.status]}>{document.status}</Badge> : <Badge>Not routed</Badge>}</div><div className="flex items-center gap-1 text-xs text-slate-500"><Eye aria-hidden="true" size={15} />{document.viewedBy.length} viewed</div></div>

      {needsReview ? (
        <section className="grid gap-3 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-[0_12px_26px_-22px_rgba(120,53,15,0.45)]"><div><p className="text-sm font-bold text-amber-950">Approval awaiting your decision</p><p className="mt-1 text-xs leading-5 text-amber-800">Stage 2 of 3 <span aria-hidden="true">·</span> {document.recipients.join(", ")}</p></div><div className="grid grid-cols-2 gap-2"><Button className="h-9 gap-1.5 rounded-xl" onClick={() => onDecision(document.id, "Completed")} title="Approve record" variant="default"><Check aria-hidden="true" size={15} />Approve</Button><Button className="h-9 gap-1.5 rounded-xl" onClick={() => onDecision(document.id, "Setback")} title="Decline record" variant="destructive"><X aria-hidden="true" size={15} />Decline</Button></div></section>
      ) : null}

      <section className="rounded-[1.25rem] border border-slate-300 bg-slate-300 p-3 shadow-[0_20px_35px_-28px_rgba(15,23,42,0.65)]">
        <article className="grid min-h-[27rem] content-start gap-6 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-3 border-b-2 border-slate-800 pb-5"><p className="text-[10px] font-bold tracking-[0.13em] text-violet-700 uppercase">Saile DMS <span aria-hidden="true">·</span> Record preview</p><h2 className="text-xl font-bold leading-tight text-slate-950">{document.title}</h2><p className="text-sm leading-6 text-slate-600">{document.subject}</p></div>
          <div className="grid gap-2.5"><div className="h-2.5 rounded-full bg-slate-200" /><div className="h-2.5 w-11/12 rounded-full bg-slate-200" /><div className="h-2.5 w-10/12 rounded-full bg-slate-200" /><div className="h-2.5 w-8/12 rounded-full bg-slate-200" /><div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-lg border border-slate-200 p-2.5"><p className="text-[10px] text-slate-400">Classification</p><p className="mt-1 text-xs font-semibold text-slate-800">{document.classification}</p></div><div className="rounded-lg border border-slate-200 p-2.5"><p className="text-[10px] text-slate-400">Reference</p><p className="mt-1 text-xs font-semibold text-slate-800">{document.barcode}</p></div></div></div>
          <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-4"><span className="text-[10px] text-slate-400">Document preview</span><span className="text-[10px] font-semibold text-slate-500">Page 1 of 1</span></div>
        </article>
      </section>

      <section className="grid grid-cols-4 gap-2" aria-label="Document quick actions">
        {actionItems.map((item) => { const Icon = item.icon; return <button className="grid min-h-16 place-items-center gap-1 rounded-2xl border border-slate-200 bg-white p-2 text-[10px] font-semibold text-slate-500 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700" key={item.label} onClick={() => onAction(item.label)} title={`${item.label} is a presentation action`} type="button"><Icon aria-hidden="true" size={18} />{item.label}</button>; })}
      </section>
    </aside>
  );
}
