import { Archive, FileText, Folder, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Folder as FolderData, MockDocument, WorkspaceView } from "../types";

interface Props {
  documents: MockDocument[];
  folders: FolderData[];
  onRestoreDocument: (document: MockDocument) => void;
  onRestoreFolder: (folder: FolderData) => void;
  view: Extract<WorkspaceView, "archives" | "trash">;
}

export function LifecycleView({ documents, folders, onRestoreDocument, onRestoreFolder, view }: Props) {
  const isArchive = view === "archives";
  if (!isArchive) return <div className="grid gap-8 p-6 lg:p-8"><header className="grid gap-2"><div className="flex items-center gap-2"><Trash2 aria-hidden="true" className="text-fuchsia-700" size={23} /><h1 className="text-3xl font-bold text-slate-950">Trash bin</h1></div><p className="max-w-2xl leading-7 text-slate-600">Permanent deletion and purge remain unavailable until retention rules are approved.</p></header><Card className="max-w-2xl border-dashed"><p className="text-sm text-slate-600">Saile DMS retains archived files, versions, attachments, grants, and audit history. Nothing is sent to a destructive trash lifecycle.</p></Card></div>;

  return <div className="grid gap-8 p-6 lg:p-8"><header className="grid gap-2"><div className="flex items-center gap-2"><Archive aria-hidden="true" className="text-fuchsia-700" size={23} /><h1 className="text-3xl font-bold text-slate-950">Archives</h1></div><p className="max-w-2xl leading-7 text-slate-600">Archived resources retain all bytes and history. Restore returns an item to its original active parent.</p></header>
    <section className="grid gap-4" aria-labelledby="archived-folders"><h2 className="text-xl font-bold" id="archived-folders">Archived folders</h2>{folders.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{folders.map((folder) => <Card className="flex items-center gap-3" key={folder.id}><Folder aria-hidden="true" className="text-amber-600" size={24} /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{folder.name}</p><p className="text-xs text-slate-500">{folder.section} · {folder.archivedAt ? new Date(folder.archivedAt).toLocaleString() : "Archived"}</p></div>{folder.canRestore ? <Button aria-label={`Restore ${folder.name}`} onClick={() => onRestoreFolder(folder)} size="sm" variant="secondary"><RotateCcw aria-hidden="true" size={15} />Restore</Button> : null}</Card>)}</div> : <p className="rounded-xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">No archived folders.</p>}</section>
    <section className="grid gap-4" aria-labelledby="archived-documents"><h2 className="text-xl font-bold" id="archived-documents">Archived records</h2>{documents.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{documents.map((document) => <Card className="flex items-center gap-3" key={document.id}><FileText aria-hidden="true" className="text-violet-700" size={24} /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{document.title}</p><p className="text-xs text-slate-500">{document.section} · {document.archivedAt ? new Date(document.archivedAt).toLocaleString() : "Archived"}</p></div>{document.canRestore ? <Button aria-label={`Restore ${document.title}`} onClick={() => onRestoreDocument(document)} size="sm" variant="secondary"><RotateCcw aria-hidden="true" size={15} />Restore</Button> : null}</Card>)}</div> : <p className="rounded-xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">No archived records.</p>}</section>
  </div>;
}
