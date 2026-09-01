import Image from "next/image";
import { MoreHorizontal } from "lucide-react";

import type { Folder as FolderData } from "../types";

interface FolderTileProps {
  folder: FolderData;
}

export function FolderTile({ folder }: FolderTileProps) {
  return (
    <article className="group flex min-h-28 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_10px_24px_-21px_rgba(15,23,42,0.5)] transition hover:border-sky-200 hover:shadow-[0_16px_30px_-22px_rgba(2,132,199,0.25)]">
      <Image alt="Folder" className="size-11 shrink-0 object-contain" height={44} src="/Icons/folder-icon.png" width={44} />
      <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold text-slate-900">{folder.name}</h3><p className="mt-1 text-xs text-slate-500">{folder.documentCount} records <span aria-hidden="true">·</span> {folder.updatedAt}</p></div>
      <button aria-label={`More options for ${folder.name}`} className="grid size-7 place-items-center rounded-lg text-slate-300 opacity-0 transition hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100 focus:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700" title="Folder options" type="button"><MoreHorizontal aria-hidden="true" size={16} /></button>
    </article>
  );
}
