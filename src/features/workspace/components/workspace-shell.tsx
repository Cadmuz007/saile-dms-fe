"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { AuthenticatedUser } from "@/features/auth/types";
import { archiveDocument as archiveDocumentRequest, archiveFolder as archiveFolderRequest, createFolder as createFolderRequest, listArchivedResources, listDocuments, listFolders, moveDocument as moveDocumentRequest, moveFolder as moveFolderRequest, printDocument, restoreDocument as restoreDocumentRequest, restoreFolder as restoreFolderRequest, uploadDocument } from "@/services/documents";
import type { ApiDocument, ApiFolder, ApiLibraryArea } from "@/services/documents";
import { listAvailableDocumentTypes } from "@/services/document-types";
import type { AvailableDocumentType } from "@/features/admin/document-types.types";
import { subscribeToWorkspaceChanges } from "@/services/workspace-realtime";
import { listWorkflowRoutes } from "@/services/workflow-instances";

import type { Folder, LibrarySection, MockDocument, WorkspaceView } from "../types";
import type { WorkflowRoute } from "../workflow.types";
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
import { SetSailDialog } from "./set-sail-dialog";
import { SectionsView } from "./sections-view";
import { WorkspaceSidebar } from "./workspace-sidebar";
import { WorkspaceTopNav } from "./workspace-top-nav";
import { BarcodeDialog } from "./barcode-dialog";
import { BarcodeManagerView } from "./barcode-manager-view";
import { printBlob } from "../printing";

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
    version: `${document.currentVersionNumber}.0`, barcode: document.barcodes?.[0]?.barcodeValue ?? "Not generated", recipients: [], viewedBy: [],
    mimeType: version?.detectedMimeType, isLive: true, documentType: document.documentType?.name,
    metadata: document.metadataValues.map((item) => ({ label: item.field.label, value: item.shortTextValue ?? item.longTextValue ?? item.selectedOptionValue ?? (item.dateValue ? new Date(item.dateValue).toLocaleDateString() : "") })), ownerUserId: document.ownerUserId, folderId: document.folderId, canMove: document.canMove, canArchive: document.canArchive, canRestore: document.canRestore, canStartWorkflow: document.canStartWorkflow, archivedAt: document.archivedAt,
  };
}

export function WorkspaceShell({ currentUser, onSignOut }: WorkspaceShellProps) {
  const [activeView, setActiveView] = useState<WorkspaceView>("home");
  const [activeSection, setActiveSection] = useState<LibrarySection>("Home");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<MockDocument[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [documentTypes, setDocumentTypes] = useState<AvailableDocumentType[]>([]);
  const [routes, setRoutes] = useState<WorkflowRoute[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<MockDocument | null>(null);
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [accessResource, setAccessResource] = useState<{ id: string; kind: "documents" | "folders"; name: string } | null>(null);
  const [realtimeRevision, setRealtimeRevision] = useState(0);
  const [moveTarget, setMoveTarget] = useState<MoveTarget | null>(null);
  const [lifecycleTarget, setLifecycleTarget] = useState<LifecycleTarget | null>(null);
  const [setSailTarget, setSetSailTarget] = useState<MockDocument | null>(null);
  const [archivedDocuments, setArchivedDocuments] = useState<MockDocument[]>([]);
  const [archivedFolders, setArchivedFolders] = useState<Folder[]>([]);
  const [barcodeTarget, setBarcodeTarget] = useState<Pick<MockDocument, "id" | "title"> | null>(null);
  const [barcodeRevision, setBarcodeRevision] = useState(0);

  const refreshSequence = useRef(0);
  const refreshWorkspace = useCallback(async (signal?: AbortSignal): Promise<void> => {
    const sequence = ++refreshSequence.current;
    const [homeFolders, privateFolders, publicFolders, homeDocuments, privateDocuments, publicDocuments, availableTypes, archives, inboundRoutes, outboundRoutes] = await Promise.all([
      listFolders("HOME", signal, true), listFolders("PRIVATE", signal, true), listFolders("PUBLIC", signal, true),
      listDocuments("HOME", signal, true), listDocuments("PRIVATE", signal, true), listDocuments("PUBLIC", signal, true),
      listAvailableDocumentTypes(signal),
      listArchivedResources(signal),
      listWorkflowRoutes("INBOUND", signal),
      listWorkflowRoutes("OUTBOUND", signal),
    ]);
    if (signal?.aborted || sequence !== refreshSequence.current) return;
    const apiFolders = [...homeFolders, ...privateFolders, ...publicFolders];
    const folderNames = new Map(apiFolders.map((folder) => [folder.id, folder.name]));
    const mappedFolders = apiFolders.map(mapFolder);
    const mappedDocuments = [...homeDocuments, ...privateDocuments, ...publicDocuments].map((document) => mapDocument(document, folderNames));
    setFolders(mappedFolders);
    setDocuments(mappedDocuments);
    setSelectedDocument((current) => current ? mappedDocuments.find((document) => document.id === current.id) ?? null : null);
    setDocumentTypes(availableTypes);
    setRoutes([...inboundRoutes, ...outboundRoutes]);
    const archivedNames = new Map([...apiFolders, ...archives.folders].map((folder) => [folder.id, folder.name]));
    setArchivedFolders(archives.folders.map(mapFolder));
    setArchivedDocuments(archives.documents.map((document) => mapDocument(document, archivedNames)));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => { void refreshWorkspace(controller.signal).catch((error) => { if (!controller.signal.aborted) setNotice(error instanceof Error ? error.message : "The workspace could not be loaded."); }); }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [refreshWorkspace]);

  useEffect(() => subscribeToWorkspaceChanges(() => { setRealtimeRevision((current) => current + 1); void refreshWorkspace().catch(() => undefined); }, () => {
    ++refreshSequence.current;
    setSelectedDocument(null); setDocuments([]); setRoutes([]); setArchivedDocuments([]); setDocumentTypes([]);
    setAccessResource(null); setMoveTarget(null); setLifecycleTarget(null); setSetSailTarget(null); setBarcodeTarget(null);
    setBarcodeRevision((value) => value + 1);
  }), [refreshWorkspace]);
  useEffect(() => { if (!notice) return; const timeout = window.setTimeout(() => setNotice(null), 4200); return () => window.clearTimeout(timeout); }, [notice]);

  useEffect(() => {
    if (activeView !== "routes") return;
    const controller = new AbortController();
    const timer = window.setInterval(() => { void refreshWorkspace(controller.signal).catch(() => {
      if (!controller.signal.aborted) { setRoutes([]); setNotice("Route deadlines could not be refreshed. Reload to try again."); }
    }); }, 60_000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [activeView, refreshWorkspace]);

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

  function showDemoAction(action: string): void { setNotice(`${action} selected.`); }
  async function handleDocumentAction(action: string, document: MockDocument): Promise<void> {
    if (action === "Barcode") { setBarcodeTarget(document); return; }
    if (action === "Print") {
      try { printBlob(await printDocument(document.id)); setNotice("The audited browser print view is opening."); }
      catch (error) { setNotice(error instanceof Error ? error.message : "Document printing is unavailable."); }
      return;
    }
    showDemoAction(action);
  }
  const canShareDocument = (document: MockDocument) => Boolean(document.isLive && document.section === "Private" && document.ownerUserId === currentUser.id && currentUser.permissions.includes("documents.share"));
  const canShareFolder = (folder: Folder) => Boolean(folder.isLive && folder.section === "Private" && folder.ownerUserId === currentUser.id && currentUser.permissions.includes("folders.share"));

  function renderWorkspace() {
    if (selectedDocument) return <DocumentDetails canManageAccess={canShareDocument(selectedDocument)} document={selectedDocument} onAction={showDemoAction} onBack={() => setSelectedDocument(null)} onManageAccess={() => setAccessResource({ id: selectedDocument.id, kind: "documents", name: selectedDocument.title })} onVersionChanged={() => refreshWorkspace()} realtimeRevision={realtimeRevision} />;
    switch (activeView) {
      case "home": return <HomeView documents={documents.filter((document) => !document.folderId)} folders={folders.filter((folder) => !folder.parentId)} routeDocuments={routes.map((route) => mapDocument(route.document, new Map(route.document.folder ? [[route.document.folder.id, route.document.folder.name]] : [])))} routes={routes} onCreateRecord={() => setIsRecordDialogOpen(true)} onOpenDocument={openDocument} onShowRoutes={() => navigate("routes")} />;
      case "sections": return <SectionsView activeSection={activeSection} canManageFolderAccess={canShareFolder} currentFolderId={currentFolderId} documents={documents} folders={folders} onArchiveDocument={(document) => setLifecycleTarget({ id: document.id, kind: "document", name: document.title, action: "archive" })} onArchiveFolder={(folder) => setLifecycleTarget({ id: folder.id, kind: "folder", name: folder.name, action: "archive" })} onLocationChange={selectLocation} onManageFolderAccess={(folder) => setAccessResource({ id: folder.id, kind: "folders", name: folder.name })} onMoveDocument={(document) => setMoveTarget({ id: document.id, kind: "document", name: document.title, section: document.section, currentFolderId: document.folderId ?? null })} onMoveFolder={(folder) => setMoveTarget({ id: folder.id, kind: "folder", name: folder.name, section: folder.section, currentFolderId: folder.parentId ?? null })} onOpenDocument={openDocument} />;
      case "routes": return <RoutesView routes={routes} onOpenDocument={(document) => openDocument(mapDocument(document, new Map(document.folder ? [[document.folder.id, document.folder.name]] : [])))} onSignOut={onSignOut} />;
      case "barcodes": return <BarcodeManagerView key={`${realtimeRevision}:${barcodeRevision}`} onManage={(documentId, documentTitle) => setBarcodeTarget({ id: documentId, title: documentTitle })} />;
      case "archives":
      case "trash": return <LifecycleView documents={archivedDocuments} folders={archivedFolders} onRestoreDocument={(document) => setLifecycleTarget({ id: document.id, kind: "document", name: document.title, action: "restore" })} onRestoreFolder={(folder) => setLifecycleTarget({ id: folder.id, kind: "folder", name: folder.name, action: "restore" })} view={activeView} />;
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/70 text-slate-950 lg:flex-row" data-workspace>
      <WorkspaceSidebar activeView={activeView} documents={documents} onCreateRecord={() => setIsRecordDialogOpen(true)} onCreateSection={() => setIsSectionDialogOpen(true)} onNavigate={navigate} onOpenDocument={openDocument} />
      <div className="flex min-w-0 flex-1 flex-col"><WorkspaceTopNav activeView={activeView} currentUser={currentUser} onNavigate={navigate} onShowSearch={() => setSelectedDocument(null)} onSignOut={onSignOut} /><main className="min-w-0 flex-1 overflow-x-hidden">{renderWorkspace()}</main></div>
      <section className="min-h-96 w-full border-t border-slate-200/90 bg-slate-50/60 lg:w-[26rem] lg:shrink-0 lg:border-t-0 lg:border-l xl:w-[29rem]">{selectedDocument ? <DocumentPreview canPrintDocument={currentUser.permissions.includes("documents.print")} canUseBarcode={["barcodes.generate", "barcodes.print", "barcodes.reprint"].some((permission) => currentUser.permissions.includes(permission))} document={selectedDocument} onAction={(action) => void handleDocumentAction(action, selectedDocument)} onSetSail={selectedDocument.canStartWorkflow ? () => setSetSailTarget(selectedDocument) : undefined} /> : <SearchPanel documents={documents} onOpenDocument={openDocument} />}</section>
      <CreateRecordDialog documentTypes={documentTypes} onCreate={createDocument} onOpenChange={setIsRecordDialogOpen} open={isRecordDialogOpen} />
      <CreateSectionDialog defaultSection={activeSection} onCreate={createSection} onOpenChange={setIsSectionDialogOpen} open={isSectionDialogOpen} parentName={currentFolderId ? folders.find((folder) => folder.id === currentFolderId)?.name : undefined} />
      <AccessGrantsDialog key={accessResource ? `access:${accessResource.kind}:${accessResource.id}` : "access-closed"} onChanged={() => refreshWorkspace()} onClose={() => setAccessResource(null)} resource={accessResource} />
      <MoveResourceDialog folders={folders} key={moveTarget ? `move:${moveTarget.kind}:${moveTarget.id}` : "move-closed"} onClose={() => setMoveTarget(null)} onMove={moveResource} target={moveTarget} />
      <LifecycleActionDialog key={lifecycleTarget ? `lifecycle:${lifecycleTarget.action}:${lifecycleTarget.kind}:${lifecycleTarget.id}` : "lifecycle-closed"} onClose={() => setLifecycleTarget(null)} onConfirm={applyLifecycle} target={lifecycleTarget} />
      <SetSailDialog key={setSailTarget ? `set-sail:${setSailTarget.id}` : "set-sail-closed"} onClose={() => setSetSailTarget(null)} onSignOut={onSignOut} onStarted={(message) => { setNotice(message); setRealtimeRevision((current) => current + 1); void refreshWorkspace().catch(() => undefined); }} target={setSailTarget ? { id: setSailTarget.id, title: setSailTarget.title, subject: setSailTarget.subject } : null} />
      {barcodeTarget ? <BarcodeDialog key={barcodeTarget.id} canGenerate={currentUser.permissions.includes("barcodes.generate")} canPrint={currentUser.permissions.includes("barcodes.print")} canReprint={currentUser.permissions.includes("barcodes.reprint")} documentId={barcodeTarget.id} documentTitle={barcodeTarget.title} onChanged={async () => { setBarcodeRevision((value) => value + 1); await refreshWorkspace(); }} onClose={() => setBarcodeTarget(null)} onNotice={setNotice} /> : null}
      <DemoNotice message={notice} onDismiss={() => setNotice(null)} />
    </div>
  );
}
