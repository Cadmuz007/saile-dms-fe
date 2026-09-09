"use client";

import { useCallback, useEffect, useState } from "react";

import type { AuthenticatedUser } from "@/features/auth/types";
import { archiveDocument as archiveDocumentRequest, archiveFolder as archiveFolderRequest, createFolder as createFolderRequest, listArchivedResources, listDocuments, listFolders, moveDocument as moveDocumentRequest, moveFolder as moveFolderRequest, restoreDocument as restoreDocumentRequest, restoreFolder as restoreFolderRequest, uploadDocument } from "@/services/documents";
import type { ApiDocument, ApiFolder, ApiLibraryArea } from "@/services/documents";
import { listAvailableDocumentTypes } from "@/services/document-types";
import type { ManagedDocumentType } from "@/features/admin/document-types.types";
import { subscribeToWorkspaceChanges } from "@/services/workspace-realtime";

import { mockRoutes } from "../mock-data";
import type { Folder, LibrarySection, MockDocument, RouteRecord, RouteStatus, WorkspaceView } from "../types";
import { CreateRecordDialog } from "./create-record-dialog";
import { CreateSectionDialog } from "./create-section-dialog";
import { AccessGrantsDialog } from "./access-grants-dialog";
import { DemoNotice } from "./demo-notice";
import { DocumentDetails } from "./document-details";
import { DocumentPreview } from "./document-preview";
import { HomeView } from "./home-view";
import { LifecycleView } from "./lifecycle-view";
import { LifecycleActionDialog, type LifecycleTarget } from "./lifecycle-action-dialog";
import { MoveResourceDialog, type MoveTarget } from "./move-resource-dialog";
import { RoutesView } from "./routes-view";
import { SearchPanel } from "./search-panel";
import { SectionsView } from "./sections-view";
import { WorkspaceSidebar } from "./workspace-sidebar";
import { WorkspaceTopNav } from "./workspace-top-nav";

interface WorkspaceShellProps { currentUser: AuthenticatedUser; onSignOut: () => void; }

const sectionByArea: Record<ApiLibraryArea, LibrarySection> = { HOME: "Home", PRIVATE: "Private", PUBLIC: "Public" };
const areaBySection: Record<LibrarySection, ApiLibraryArea> = { Home: "HOME", Private: "PRIVATE", Public: "PUBLIC" };

function displaySize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extensionOf(filename: string): MockDocument["extension"] {
  const value = filename.split(".").pop()?.toUpperCase();
  if (value === "JPG" || value === "JPEG") return "JPEG";
  return value === "DOCX" || value === "XLSX" || value === "PPTX" || value === "TXT" || value === "CSV" || value === "PNG" ? value : "PDF";
}

function mapFolder(folder: ApiFolder): Folder {
  return { id: folder.id, name: folder.name, section: sectionByArea[folder.area], parentId: folder.parentId, documentCount: folder._count.documents, updatedAt: new Date(folder.updatedAt).toLocaleDateString(), ownerUserId: folder.ownerUserId, canMove: folder.canMove, canArchive: folder.canArchive, canRestore: folder.canRestore, archivedAt: folder.archivedAt, isLive: !folder.archivedAt };
}

function mapDocument(document: ApiDocument, folderNames: Map<string, string>): MockDocument {
  const version = document.versions[0];
  return {
    id: document.id, title: document.title, extension: extensionOf(version?.originalFilename ?? "document.pdf"), section: sectionByArea[document.area],
    folder: document.folderId ? folderNames.get(document.folderId) ?? "Folder" : "Root", subject: document.subject ?? "", description: document.description ?? "",
    classification: document.classification === "CLASSIFIED" ? "Classified" : "Unclassified", size: displaySize(version?.byteSize ?? 0),
    uploadedAt: new Date(version?.uploadedAt ?? document.createdAt).toLocaleString(), uploadedBy: version ? `${version.uploadedBy.firstName} ${version.uploadedBy.lastName}` : "",
    version: `${document.currentVersionNumber}.0`, barcode: `SDL-${document.id.slice(0, 8).toUpperCase()}`, recipients: [], viewedBy: [],
    mimeType: version?.detectedMimeType, isLive: true, documentType: document.documentType?.name,
    metadata: document.metadataValues.map((item) => ({ label: item.field.label, value: item.shortTextValue ?? item.longTextValue ?? item.selectedOptionValue ?? (item.dateValue ? new Date(item.dateValue).toLocaleDateString() : "") })), ownerUserId: document.ownerUserId, folderId: document.folderId, canMove: document.canMove, canArchive: document.canArchive, canRestore: document.canRestore, archivedAt: document.archivedAt,
  };
}

export function WorkspaceShell({ currentUser, onSignOut }: WorkspaceShellProps) {
  const [activeView, setActiveView] = useState<WorkspaceView>("home");
  const [activeSection, setActiveSection] = useState<LibrarySection>("Home");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<MockDocument[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [documentTypes, setDocumentTypes] = useState<ManagedDocumentType[]>([]);
  const [routes, setRoutes] = useState<RouteRecord[]>(mockRoutes);
  const [selectedDocument, setSelectedDocument] = useState<MockDocument | null>(null);
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [accessResource, setAccessResource] = useState<{ id: string; kind: "documents" | "folders"; name: string } | null>(null);
  const [realtimeRevision, setRealtimeRevision] = useState(0);
  const [moveTarget, setMoveTarget] = useState<MoveTarget | null>(null);
  const [lifecycleTarget, setLifecycleTarget] = useState<LifecycleTarget | null>(null);
  const [archivedDocuments, setArchivedDocuments] = useState<MockDocument[]>([]);
  const [archivedFolders, setArchivedFolders] = useState<Folder[]>([]);

  const refreshWorkspace = useCallback(async (signal?: AbortSignal): Promise<void> => {
    const [homeFolders, privateFolders, publicFolders, homeDocuments, privateDocuments, publicDocuments, availableTypes, archives] = await Promise.all([
      listFolders("HOME", signal, true), listFolders("PRIVATE", signal, true), listFolders("PUBLIC", signal, true),
      listDocuments("HOME", signal, true), listDocuments("PRIVATE", signal, true), listDocuments("PUBLIC", signal, true),
      listAvailableDocumentTypes(signal),
      listArchivedResources(signal),
    ]);
    const apiFolders = [...homeFolders, ...privateFolders, ...publicFolders];
    const folderNames = new Map(apiFolders.map((folder) => [folder.id, folder.name]));
    const mappedFolders = apiFolders.map(mapFolder);
    const mappedDocuments = [...homeDocuments, ...privateDocuments, ...publicDocuments].map((document) => mapDocument(document, folderNames));
    setFolders(mappedFolders);
    setDocuments(mappedDocuments);
    setSelectedDocument((current) => current ? mappedDocuments.find((document) => document.id === current.id) ?? null : null);
    setDocumentTypes(availableTypes);
    const archivedNames = new Map([...apiFolders, ...archives.folders].map((folder) => [folder.id, folder.name]));
    setArchivedFolders(archives.folders.map(mapFolder));
    setArchivedDocuments(archives.documents.map((document) => mapDocument(document, archivedNames)));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => { void refreshWorkspace(controller.signal).catch((error) => { if (!controller.signal.aborted) setNotice(error instanceof Error ? error.message : "The workspace could not be loaded."); }); }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [refreshWorkspace]);

  useEffect(() => subscribeToWorkspaceChanges(() => { setRealtimeRevision((current) => current + 1); void refreshWorkspace().catch(() => undefined); }), [refreshWorkspace]);
  useEffect(() => { if (!notice) return; const timeout = window.setTimeout(() => setNotice(null), 4200); return () => window.clearTimeout(timeout); }, [notice]);

  function navigate(view: WorkspaceView): void { setActiveView(view); setSelectedDocument(null); }
  function openDocument(document: MockDocument): void { setSelectedDocument(document); }

  async function createDocument(input: { title: string; section: LibrarySection; classification: MockDocument["classification"]; documentTypeId?: string; metadata: Array<{ fieldId: string; value: string }>; file: File }): Promise<void> {
    await uploadDocument({ title: input.title, area: areaBySection[input.section], folderId: input.section === activeSection ? currentFolderId ?? undefined : undefined, classification: input.classification === "Classified" ? "CLASSIFIED" : "UNCLASSIFIED", documentTypeId: input.documentTypeId, metadata: input.metadata, file: input.file });
    await refreshWorkspace(); setActiveView("sections"); setNotice(`“${input.title}” was securely uploaded.`);
  }

  async function createSection(input: Pick<Folder, "name" | "section">): Promise<void> {
    await createFolderRequest({ name: input.name, area: areaBySection[input.section], parentId: input.section === activeSection ? currentFolderId ?? undefined : undefined });
    await refreshWorkspace(); navigate("sections"); setNotice(`“${input.name}” was added to your workspace.`);
  }

  async function moveResource(target: MoveTarget, destinationId: string | null): Promise<void> {
    if (target.kind === "folder") await moveFolderRequest(target.id, destinationId);
    else await moveDocumentRequest(target.id, destinationId);
    await refreshWorkspace();
    setNotice(`“${target.name}” was moved.`);
  }

  async function applyLifecycle(target: LifecycleTarget): Promise<void> {
    if (target.action === "archive") {
      if (target.kind === "folder") await archiveFolderRequest(target.id);
      else await archiveDocumentRequest(target.id);
    } else if (target.kind === "folder") await restoreFolderRequest(target.id);
    else await restoreDocumentRequest(target.id);
    await refreshWorkspace();
    setNotice(`“${target.name}” was ${target.action === "archive" ? "archived" : "restored"}.`);
  }

  function selectLocation(section: LibrarySection, folderId: string | null): void {
    setActiveSection(section);
    setCurrentFolderId(folderId);
  }

  function updateDocumentStatus(documentId: string, status: RouteStatus): void {
    setDocuments((current) => current.map((document) => document.id === documentId ? { ...document, status } : document));
    setRoutes((current) => current.map((route) => route.documentId === documentId ? { ...route, status, responseTime: status === "Completed" ? "Completed just now" : "Set back just now" } : route));
    setSelectedDocument((current) => current?.id === documentId ? { ...current, status } : current);
    setNotice(status === "Completed" ? "Approval recorded successfully." : "The record was set back successfully.");
  }

  function showDemoAction(action: string): void { setNotice(`${action} selected.`); }
  const canShareDocument = (document: MockDocument) => Boolean(document.isLive && document.section === "Private" && document.ownerUserId === currentUser.id && currentUser.permissions.includes("documents.share"));
  const canShareFolder = (folder: Folder) => Boolean(folder.isLive && folder.section === "Private" && folder.ownerUserId === currentUser.id && currentUser.permissions.includes("folders.share"));

  function renderWorkspace() {
    if (selectedDocument) return <DocumentDetails canManageAccess={canShareDocument(selectedDocument)} document={selectedDocument} onAction={showDemoAction} onBack={() => setSelectedDocument(null)} onManageAccess={() => setAccessResource({ id: selectedDocument.id, kind: "documents", name: selectedDocument.title })} onVersionChanged={() => refreshWorkspace()} realtimeRevision={realtimeRevision} />;
    switch (activeView) {
      case "home": return <HomeView documents={documents.filter((document) => !document.folderId)} folders={folders.filter((folder) => !folder.parentId)} routes={routes} onCreateRecord={() => setIsRecordDialogOpen(true)} onOpenDocument={openDocument} onShowRoutes={() => navigate("routes")} />;
      case "sections": return <SectionsView activeSection={activeSection} canManageFolderAccess={canShareFolder} currentFolderId={currentFolderId} documents={documents} folders={folders} onArchiveDocument={(document) => setLifecycleTarget({ id: document.id, kind: "document", name: document.title, action: "archive" })} onArchiveFolder={(folder) => setLifecycleTarget({ id: folder.id, kind: "folder", name: folder.name, action: "archive" })} onLocationChange={selectLocation} onManageFolderAccess={(folder) => setAccessResource({ id: folder.id, kind: "folders", name: folder.name })} onMoveDocument={(document) => setMoveTarget({ id: document.id, kind: "document", name: document.title, section: document.section, currentFolderId: document.folderId ?? null })} onMoveFolder={(folder) => setMoveTarget({ id: folder.id, kind: "folder", name: folder.name, section: folder.section, currentFolderId: folder.parentId ?? null })} onOpenDocument={openDocument} />;
      case "routes": return <RoutesView documents={documents} routes={routes} onOpenDocument={openDocument} />;
      case "archives":
      case "trash": return <LifecycleView documents={archivedDocuments} folders={archivedFolders} onRestoreDocument={(document) => setLifecycleTarget({ id: document.id, kind: "document", name: document.title, action: "restore" })} onRestoreFolder={(folder) => setLifecycleTarget({ id: folder.id, kind: "folder", name: folder.name, action: "restore" })} view={activeView} />;
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/70 text-slate-950 lg:flex-row" data-workspace>
      <WorkspaceSidebar activeView={activeView} documents={documents} onCreateRecord={() => setIsRecordDialogOpen(true)} onCreateSection={() => setIsSectionDialogOpen(true)} onNavigate={navigate} onOpenDocument={openDocument} />
      <div className="flex min-w-0 flex-1 flex-col"><WorkspaceTopNav activeView={activeView} currentUser={currentUser} onNavigate={navigate} onShowSearch={() => setSelectedDocument(null)} onSignOut={onSignOut} /><main className="min-w-0 flex-1 overflow-x-hidden">{renderWorkspace()}</main></div>
      <section className="min-h-96 w-full border-t border-slate-200/90 bg-slate-50/60 lg:w-[26rem] lg:shrink-0 lg:border-t-0 lg:border-l xl:w-[29rem]">{selectedDocument ? <DocumentPreview document={selectedDocument} onAction={showDemoAction} onDecision={updateDocumentStatus} /> : <SearchPanel documents={documents} onOpenDocument={openDocument} />}</section>
      <CreateRecordDialog documentTypes={documentTypes} onCreate={createDocument} onOpenChange={setIsRecordDialogOpen} open={isRecordDialogOpen} />
      <CreateSectionDialog defaultSection={activeSection} onCreate={createSection} onOpenChange={setIsSectionDialogOpen} open={isSectionDialogOpen} parentName={currentFolderId ? folders.find((folder) => folder.id === currentFolderId)?.name : undefined} />
      <AccessGrantsDialog key={accessResource ? `access:${accessResource.kind}:${accessResource.id}` : "access-closed"} onChanged={() => refreshWorkspace()} onClose={() => setAccessResource(null)} resource={accessResource} />
      <MoveResourceDialog folders={folders} key={moveTarget ? `move:${moveTarget.kind}:${moveTarget.id}` : "move-closed"} onClose={() => setMoveTarget(null)} onMove={moveResource} target={moveTarget} />
      <LifecycleActionDialog key={lifecycleTarget ? `lifecycle:${lifecycleTarget.action}:${lifecycleTarget.kind}:${lifecycleTarget.id}` : "lifecycle-closed"} onClose={() => setLifecycleTarget(null)} onConfirm={applyLifecycle} target={lifecycleTarget} />
      <DemoNotice message={notice} onDismiss={() => setNotice(null)} />
    </div>
  );
}
