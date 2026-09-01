"use client";

import { useEffect, useState } from "react";

import { mockDocuments, mockFolders, mockRoutes } from "../mock-data";
import type { Folder, MockDocument, RouteRecord, RouteStatus, WorkspaceView } from "../types";
import { CreateRecordDialog } from "./create-record-dialog";
import { CreateSectionDialog } from "./create-section-dialog";
import { DemoNotice } from "./demo-notice";
import { DocumentDetails } from "./document-details";
import { DocumentPreview } from "./document-preview";
import { HomeView } from "./home-view";
import { LifecycleView } from "./lifecycle-view";
import { RoutesView } from "./routes-view";
import { SearchPanel } from "./search-panel";
import { SectionsView } from "./sections-view";
import { WorkspaceSidebar } from "./workspace-sidebar";
import { WorkspaceTopNav } from "./workspace-top-nav";

export function WorkspaceShell() {
  const [activeView, setActiveView] = useState<WorkspaceView>("home");
  const [documents, setDocuments] = useState<MockDocument[]>(mockDocuments);
  const [folders, setFolders] = useState<Folder[]>(mockFolders);
  const [routes, setRoutes] = useState<RouteRecord[]>(mockRoutes);
  const [selectedDocument, setSelectedDocument] = useState<MockDocument | null>(null);
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function navigate(view: WorkspaceView): void {
    setActiveView(view);
    setSelectedDocument(null);
  }

  function openDocument(document: MockDocument): void {
    setSelectedDocument(document);
  }

  function createDocument(input: Pick<MockDocument, "title" | "section" | "classification" | "extension" | "size">): void {
    const document: MockDocument = {
      id: `record-${Date.now()}`,
      title: input.title,
      extension: input.extension,
      section: input.section,
      folder: "New records",
      subject: "New record",
      description: "A newly created record in the Saile DMS workspace.",
      classification: input.classification,
      size: input.size,
      uploadedAt: "Just now",
      uploadedBy: "Alex Rivera",
      version: "1.0",
      barcode: `SDL-2026-${String(documents.length + 1).padStart(6, "0")}`,
      recipients: [],
      viewedBy: ["Alex Rivera"],
    };

    setDocuments((current) => [document, ...current]);
    setSelectedDocument(document);
    setActiveView("sections");
    setNotice(`“${document.title}” was added to your workspace.`);
  }

  function createSection(input: Pick<Folder, "name" | "section">): void {
    const folder: Folder = {
      id: `folder-${Date.now()}`,
      name: input.name,
      section: input.section,
      documentCount: 0,
      updatedAt: "Just now",
    };

    setFolders((current) => [folder, ...current]);
    navigate("sections");
    setNotice(`“${folder.name}” was added to your workspace.`);
  }

  function updateDocumentStatus(documentId: string, status: RouteStatus): void {
    setDocuments((current) => current.map((document) => document.id === documentId ? { ...document, status } : document));
    setRoutes((current) => current.map((route) => route.documentId === documentId ? { ...route, status, responseTime: status === "Completed" ? "Completed just now" : "Set back just now" } : route));
    setSelectedDocument((current) => current?.id === documentId ? { ...current, status } : current);
    setNotice(status === "Completed" ? "Approval recorded successfully." : "The record was set back successfully.");
  }

  function showDemoAction(action: string): void {
    setNotice(`${action} selected.`);
  }

  function renderWorkspace() {
    if (selectedDocument) {
      return <DocumentDetails document={selectedDocument} onAction={showDemoAction} onBack={() => setSelectedDocument(null)} />;
    }

    switch (activeView) {
      case "home":
        return <HomeView documents={documents} folders={folders} routes={routes} onCreateRecord={() => setIsRecordDialogOpen(true)} onOpenDocument={openDocument} onShowRoutes={() => navigate("routes")} />;
      case "sections":
        return <SectionsView documents={documents} folders={folders} onOpenDocument={openDocument} />;
      case "routes":
        return <RoutesView documents={documents} routes={routes} onOpenDocument={openDocument} />;
      case "archives":
      case "trash":
        return <LifecycleView view={activeView} />;
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/70 text-slate-950 lg:flex-row" data-workspace>
      <WorkspaceSidebar activeView={activeView} documents={documents} onCreateRecord={() => setIsRecordDialogOpen(true)} onCreateSection={() => setIsSectionDialogOpen(true)} onNavigate={navigate} onOpenDocument={openDocument} />
      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceTopNav activeView={activeView} onNavigate={navigate} onShowSearch={() => setSelectedDocument(null)} />
        <main className="min-w-0 flex-1 overflow-x-hidden">{renderWorkspace()}</main>
      </div>
      <section className="min-h-96 w-full border-t border-slate-200/90 bg-slate-50/60 lg:w-[26rem] lg:shrink-0 lg:border-t-0 lg:border-l xl:w-[29rem]">
        {selectedDocument ? <DocumentPreview document={selectedDocument} onAction={showDemoAction} onDecision={updateDocumentStatus} /> : <SearchPanel documents={documents} onOpenDocument={openDocument} />}
      </section>
      <CreateRecordDialog onCreate={createDocument} onOpenChange={setIsRecordDialogOpen} open={isRecordDialogOpen} />
      <CreateSectionDialog onCreate={createSection} onOpenChange={setIsSectionDialogOpen} open={isSectionDialogOpen} />
      <DemoNotice message={notice} onDismiss={() => setNotice(null)} />
    </div>
  );
}
