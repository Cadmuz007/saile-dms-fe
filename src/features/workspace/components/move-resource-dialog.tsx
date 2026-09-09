"use client";

import { FolderInput, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { Folder, LibrarySection } from "../types";

export interface MoveTarget { id: string; kind: "folder" | "document"; name: string; section: LibrarySection; currentFolderId: string | null; }
interface Props { folders: Folder[]; onClose: () => void; onMove: (target: MoveTarget, destinationId: string | null) => Promise<void>; target: MoveTarget | null; }

function pathFor(folder: Folder, byId: Map<string, Folder>): string {
  const names = [folder.name];
  const seen = new Set([folder.id]);
  let parentId = folder.parentId;
  while (parentId) { if (seen.has(parentId)) break; seen.add(parentId); const parent = byId.get(parentId); if (!parent) break; names.unshift(parent.name); parentId = parent.parentId; }
  return names.join(" / ");
}

export function MoveResourceDialog({ folders, onClose, onMove, target }: Props) {
  const [destinationId, setDestinationId] = useState(target?.currentFolderId ?? "");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const options = useMemo(() => {
    if (!target) return [];
    const sameArea = folders.filter((folder) => folder.section === target.section);
    const byId = new Map(sameArea.map((folder) => [folder.id, folder]));
    const excluded = new Set<string>();
    if (target.kind === "folder") {
      excluded.add(target.id);
      let changed = true;
      while (changed) { changed = false; for (const folder of sameArea) if (folder.parentId && excluded.has(folder.parentId) && !excluded.has(folder.id)) { excluded.add(folder.id); changed = true; } }
    }
    return sameArea.filter((folder) => folder.canMove && !excluded.has(folder.id)).map((folder) => ({ id: folder.id, label: pathFor(folder, byId) })).sort((a, b) => a.label.localeCompare(b.label));
  }, [folders, target]);
  if (!target) return null;

  async function submit(): Promise<void> {
    setRequestError(null); setIsSubmitting(true);
    try { await onMove(target!, destinationId || null); onClose(); }
    catch (error) { setRequestError(error instanceof Error ? error.message : "The item could not be moved."); }
    finally { setIsSubmitting(false); }
  }

  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm" role="presentation"><section aria-labelledby="move-resource-title" aria-modal="true" className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl" role="dialog"><div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5"><div><p className="text-xs font-bold tracking-[0.12em] text-violet-700 uppercase">{target.section}</p><h2 className="mt-1 text-xl font-bold text-slate-950" id="move-resource-title">Move {target.kind}</h2><p className="mt-1 text-sm text-slate-500">Choose a destination for “{target.name}”. Moves stay within the same document area.</p></div><button aria-label="Close move dialog" className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700" onClick={onClose} type="button"><X aria-hidden="true" size={18} /></button></div><div className="grid gap-5 p-5"><div className="grid gap-2"><label className="text-sm font-semibold text-slate-800" htmlFor="move-destination">Destination</label><select className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100" id="move-destination" onChange={(event) => setDestinationId(event.target.value)} value={destinationId}><option value="">{target.section} root</option>{options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></div>{requestError ? <p className="text-sm font-medium text-rose-600" role="alert">{requestError}</p> : null}<div className="flex items-center gap-2 rounded-lg bg-violet-50 p-3 text-xs leading-5 text-violet-800"><FolderInput aria-hidden="true" size={17} />Inherited access is recalculated from the destination path.</div><div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><Button onClick={onClose} type="button" variant="secondary">Cancel</Button><Button disabled={isSubmitting || destinationId === (target.currentFolderId ?? "")} onClick={() => void submit()} type="button">{isSubmitting ? "Moving…" : "Move"}</Button></div></div></section></div>;
}
