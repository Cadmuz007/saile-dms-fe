import Image from "next/image";
import { Archive, FolderInput, MoreHorizontal } from "lucide-react";

import type { Folder as FolderData } from "../types";

interface FolderTileProps {
  folder: FolderData;
  onArchive?: (folder: FolderData) => void;
  onManageAccess?: (folder: FolderData) => void;
  onMove?: (folder: FolderData) => void;
  onOpen?: (folder: FolderData) => void;
}

const actionClass = "grid size-7 place-items-center rounded-lg text-slate-400 opacity-0 transition group-hover:opacity-100 focus:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2";

export function FolderTile({ folder, onArchive, onManageAccess, onMove, onOpen }: FolderTileProps) {
  return (
    <article className="group flex min-h-28 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_10px_24px_-21px_rgba(15,23,42,0.5)] transition hover:border-sky-200">
      <button className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700" onClick={() => onOpen?.(folder)} type="button">
        <Image alt="" className="size-11 shrink-0 object-contain" height={44} src="/Icons/folder-icon.png" width={44} />
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-900">{folder.name}</span><span className="mt-1 block text-xs text-slate-500">{folder.documentCount} records · {folder.updatedAt}</span></span>
      </button>
      <div className="flex gap-1">
        {onArchive ? <button aria-label={`Archive ${folder.name}`} className={`${actionClass} hover:bg-amber-50 hover:text-amber-700 focus-visible:outline-amber-700`} onClick={() => onArchive(folder)} title="Archive folder" type="button"><Archive aria-hidden="true" size={15} /></button> : null}
        {onMove ? <button aria-label={`Move ${folder.name}`} className={`${actionClass} hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-violet-700`} onClick={() => onMove(folder)} title="Move folder" type="button"><FolderInput aria-hidden="true" size={15} /></button> : null}
        {onManageAccess ? <button aria-label={`Manage access for ${folder.name}`} className={`${actionClass} hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-violet-700`} onClick={() => onManageAccess(folder)} title="Manage access" type="button"><MoreHorizontal aria-hidden="true" size={16} /></button> : null}
      </div>
    </article>
  );
}
