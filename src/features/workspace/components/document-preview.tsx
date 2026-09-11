"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Barcode, Eye, Printer, Sailboat, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { fetchDocumentPreview } from "@/services/documents";

import type { MockDocument, RouteStatus } from "../types";

interface DocumentPreviewProps {
  document: MockDocument;
  onAction: (action: string) => void;
  onSetSail?: () => void;
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

export function DocumentPreview({ document, onAction, onSetSail }: DocumentPreviewProps) {
  const canPreview = document.mimeType === "application/pdf" || document.mimeType?.startsWith("image/") === true;
  const [preview, setPreview] = useState<{ documentId: string; url?: string; error?: string } | null>(null);
  const previewUrl = preview?.documentId === document.id ? preview.url : undefined;
  const previewError = preview?.documentId === document.id ? preview.error : undefined;

  useEffect(() => {
    if (!document.isLive || !canPreview) return;
    let url: string | null = null;
    void fetchDocumentPreview(document.id).then((blob) => { url = URL.createObjectURL(blob); setPreview({ documentId: document.id, url }); }).catch((error) => setPreview({ documentId: document.id, error: error instanceof Error ? error.message : "Preview is unavailable." }));
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [canPreview, document.id, document.isLive]);

  return (
    <aside aria-label="Document preview and approval" className="grid h-full content-start gap-5 overflow-y-auto bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.09),transparent_14rem)] p-5">
      <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="text-xs font-semibold text-slate-500">Status</span>{document.status ? <Badge tone={statusTone[document.status]}>{document.status}</Badge> : <Badge>Not routed</Badge>}</div><div className="flex items-center gap-1 text-xs text-slate-500"><Eye aria-hidden="true" size={15} />{document.viewedBy.length} viewed</div></div>

      <section className="rounded-[1.25rem] border border-slate-300 bg-slate-300 p-3 shadow-[0_20px_35px_-28px_rgba(15,23,42,0.65)]">
        {previewUrl ? (
          document.mimeType?.startsWith("image/") ? <div className="relative min-h-[27rem] w-full bg-white"><Image alt={`Preview of ${document.title}`} fill className="object-contain" src={previewUrl} unoptimized /></div> : <iframe className="h-[34rem] w-full bg-white" src={previewUrl} title={`Preview of ${document.title}`} />
        ) : document.isLive ? (
          <div className="grid min-h-[27rem] place-items-center bg-white p-8 text-center text-sm text-slate-600">
            {previewError ?? (canPreview ? "Loading secure preview…" : "This Office or text document is download-only in the initial release.")}
          </div>
        ) : <article className="grid min-h-[27rem] content-start gap-6 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-3 border-b-2 border-slate-800 pb-5"><p className="text-[10px] font-bold tracking-[0.13em] text-violet-700 uppercase">Saile DMS <span aria-hidden="true">·</span> Record preview</p><h2 className="text-xl font-bold leading-tight text-slate-950">{document.title}</h2><p className="text-sm leading-6 text-slate-600">{document.subject}</p></div>
          <div className="grid gap-2.5"><div className="h-2.5 rounded-full bg-slate-200" /><div className="h-2.5 w-11/12 rounded-full bg-slate-200" /><div className="h-2.5 w-10/12 rounded-full bg-slate-200" /><div className="h-2.5 w-8/12 rounded-full bg-slate-200" /><div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-lg border border-slate-200 p-2.5"><p className="text-[10px] text-slate-400">Classification</p><p className="mt-1 text-xs font-semibold text-slate-800">{document.classification}</p></div><div className="rounded-lg border border-slate-200 p-2.5"><p className="text-[10px] text-slate-400">Reference</p><p className="mt-1 text-xs font-semibold text-slate-800">{document.barcode}</p></div></div></div>
          <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-4"><span className="text-[10px] text-slate-400">Document preview</span><span className="text-[10px] font-semibold text-slate-500">Page 1 of 1</span></div>
        </article>}
      </section>

      <section className="grid grid-cols-4 gap-2" aria-label="Document quick actions">
        {actionItems.filter((item) => item.label !== "Set Sail" || onSetSail).map((item) => { const Icon = item.icon; const liveSetSail = item.label === "Set Sail" && onSetSail; return <button className="grid min-h-16 place-items-center gap-1 rounded-2xl border border-slate-200 bg-white p-2 text-[10px] font-semibold text-slate-500 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700" key={item.label} onClick={() => liveSetSail ? onSetSail() : onAction(item.label)} title={liveSetSail ? "Start a published Set Sail workflow" : `${item.label} is a presentation action`} type="button"><Icon aria-hidden="true" size={18} />{item.label}</button>; })}
      </section>
    </aside>
  );
}
