import { Archive, ArrowUpRight, FolderInput } from "lucide-react";

import type { MockDocument, RouteStatus } from "../types";
import { DocumentTypeIcon } from "./document-type-icon";

interface DocumentTileProps { document: MockDocument; onArchive?: (document: MockDocument) => void; onOpen: (document: MockDocument) => void; onMove?: (document: MockDocument) => void; }
const statuses: Record<RouteStatus, string> = { Pending: "Pending", Review: "Review", Completed: "Completed", Setback: "Setback" };

export function DocumentTile({ document, onArchive, onMove, onOpen }: DocumentTileProps) {
  return <article className="group relative min-h-40 rounded-2xl border border-slate-200 bg-white shadow-[0_12px_24px_-20px_rgba(15,23,42,0.5)] transition hover:border-violet-200">
    <button className="grid min-h-40 w-full content-between gap-5 p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700" onClick={() => onOpen(document)} type="button"><div className="flex items-center justify-between"><DocumentTypeIcon extension={document.extension} />{document.status ? <span className="text-xs font-semibold text-slate-500">{statuses[document.status]}</span> : <ArrowUpRight aria-hidden="true" className="text-slate-400" size={17} />}</div><div><h3 className="line-clamp-2 text-sm font-semibold text-slate-900">{document.title}</h3><p className="mt-1 text-xs text-slate-500">{document.extension} · {document.size}</p></div></button>
    <div className="absolute right-3 bottom-3 flex gap-1">{onArchive ? <button aria-label={`Archive ${document.title}`} className="grid size-8 place-items-center rounded-lg bg-white text-slate-400 opacity-0 shadow-sm transition hover:bg-amber-50 hover:text-amber-700 group-hover:opacity-100 focus:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700" onClick={() => onArchive(document)} title="Archive document" type="button"><Archive aria-hidden="true" size={16} /></button> : null}{onMove ? <button aria-label={`Move ${document.title}`} className="grid size-8 place-items-center rounded-lg bg-white text-slate-400 opacity-0 shadow-sm transition hover:bg-slate-100 hover:text-violet-700 group-hover:opacity-100 focus:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700" onClick={() => onMove(document)} title="Move document" type="button"><FolderInput aria-hidden="true" size={16} /></button> : null}</div>
  </article>;
}
