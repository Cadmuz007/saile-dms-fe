"use client";

import { ChevronRight, FolderOpen } from "lucide-react";
import type { Folder, LibrarySection, MockDocument } from "../types";
import { DocumentTile } from "./document-tile";
import { FolderTile } from "./folder-tile";

interface Props {
  activeSection: LibrarySection;
  canManageFolderAccess: (folder: Folder) => boolean;
  currentFolderId: string | null;
  documents: MockDocument[];
  folders: Folder[];
  onArchiveDocument: (document: MockDocument) => void;
  onArchiveFolder: (folder: Folder) => void;
  onLocationChange: (section: LibrarySection, folderId: string | null) => void;
  onManageFolderAccess: (folder: Folder) => void;
  onMoveDocument: (document: MockDocument) => void;
  onMoveFolder: (folder: Folder) => void;
  onOpenDocument: (document: MockDocument) => void;
}

const sections: LibrarySection[] = ["Home", "Private", "Public"];

export function SectionsView(props: Props) {
  const sectionFolders = props.folders.filter((folder) => folder.section === props.activeSection);
  const byId = new Map(sectionFolders.map((folder) => [folder.id, folder]));
  const visibleFolders = sectionFolders.filter((folder) => (folder.parentId ?? null) === props.currentFolderId);
  const visibleDocuments = props.documents.filter((document) => document.section === props.activeSection && (document.folderId ?? null) === props.currentFolderId);
  const breadcrumbs: Folder[] = [];
  const seen = new Set<string>();
  let cursor = props.currentFolderId;
  while (cursor && !seen.has(cursor)) { seen.add(cursor); const folder = byId.get(cursor); if (!folder) break; breadcrumbs.unshift(folder); cursor = folder.parentId ?? null; }
  const currentFolder = props.currentFolderId ? byId.get(props.currentFolderId) : undefined;

  return <div className="grid gap-8 p-6 lg:p-8">
    <header className="grid gap-4"><div className="flex flex-wrap gap-2" role="tablist" aria-label="Document sections">{sections.map((section) => <button aria-selected={props.activeSection === section} className="min-h-11 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:border-sky-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 aria-selected:border-fuchsia-700 aria-selected:bg-fuchsia-50 aria-selected:text-fuchsia-800" key={section} onClick={() => props.onLocationChange(section, null)} role="tab" type="button">{section}</button>)}</div>
      <nav aria-label="Folder breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-slate-500"><button className="rounded px-1 py-0.5 hover:text-violet-700 focus-visible:outline-2 focus-visible:outline-violet-700" onClick={() => props.onLocationChange(props.activeSection, null)} type="button">{props.activeSection}</button>{breadcrumbs.map((folder) => <span className="contents" key={folder.id}><ChevronRight aria-hidden="true" size={15} /><button aria-current={folder.id === props.currentFolderId ? "page" : undefined} className="max-w-48 truncate rounded px-1 py-0.5 font-semibold text-slate-800 hover:text-violet-700 focus-visible:outline-2 focus-visible:outline-violet-700" onClick={() => props.onLocationChange(props.activeSection, folder.id)} type="button">{folder.name}</button></span>)}</nav>
      <div className="flex items-center gap-2"><FolderOpen aria-hidden="true" className="text-fuchsia-700" size={22} /><h1 className="text-3xl font-bold tracking-tight text-slate-950">{currentFolder?.name ?? `${props.activeSection} section`}</h1></div><p className="leading-7 text-slate-600">{currentFolder ? `Folders and records in ${currentFolder.name}.` : "Open a folder to browse its nested contents."}</p></header>
    <section className="grid gap-4" aria-labelledby="folders-heading"><h2 className="text-xl font-bold text-slate-950" id="folders-heading">Folders</h2>{visibleFolders.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visibleFolders.map((folder) => <FolderTile folder={folder} key={folder.id} onArchive={folder.canArchive ? props.onArchiveFolder : undefined} onManageAccess={props.canManageFolderAccess(folder) ? props.onManageFolderAccess : undefined} onMove={folder.canMove ? props.onMoveFolder : undefined} onOpen={(item) => props.onLocationChange(props.activeSection, item.id)} />)}</div> : <p className="rounded-xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">No folders in this location.</p>}</section>
    <section className="grid gap-4" aria-labelledby="records-heading"><h2 className="text-xl font-bold text-slate-950" id="records-heading">Records</h2>{visibleDocuments.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visibleDocuments.map((document) => <DocumentTile document={document} key={document.id} onArchive={document.canArchive ? props.onArchiveDocument : undefined} onMove={document.canMove ? props.onMoveDocument : undefined} onOpen={props.onOpenDocument} />)}</div> : <p className="rounded-xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">No records in this location.</p>}</section>
  </div>;
}
