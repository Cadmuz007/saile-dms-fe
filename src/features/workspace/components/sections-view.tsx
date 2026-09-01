"use client";

import { useState } from "react";

import { ChevronRight, FolderOpen } from "lucide-react";

import type { Folder, LibrarySection, MockDocument } from "../types";
import { DocumentTile } from "./document-tile";
import { FolderTile } from "./folder-tile";

interface SectionsViewProps {
  documents: MockDocument[];
  folders: Folder[];
  onOpenDocument: (document: MockDocument) => void;
}

const sections: LibrarySection[] = ["Home", "Private", "Public"];

export function SectionsView({ documents, folders, onOpenDocument }: SectionsViewProps) {
  const [activeSection, setActiveSection] = useState<LibrarySection>("Home");
  const sectionFolders = folders.filter((folder) => folder.section === activeSection);
  const sectionDocuments = documents.filter((document) => document.section === activeSection);

  return (
    <div className="grid gap-8 p-6 lg:p-8">
      <div className="grid gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Sections</span>
          <ChevronRight aria-hidden="true" size={16} />
          <span className="font-semibold text-slate-800">{activeSection}</span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <FolderOpen aria-hidden="true" className="text-fuchsia-700" size={22} />
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">{activeSection} section</h1>
            </div>
            <p className="leading-7 text-slate-600">
              {activeSection === "Private"
                ? "Restricted records and folders for permitted users and groups."
                : activeSection === "Public"
                  ? "Shared records available to licensed users."
                  : "Your personal document library and working folders."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Document sections">
            {sections.map((section) => (
              <button
                aria-selected={activeSection === section}
                className="min-h-11 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition-colors hover:border-sky-300 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 aria-selected:border-fuchsia-700 aria-selected:bg-fuchsia-50 aria-selected:text-fuchsia-800"
                key={section}
                onClick={() => setActiveSection(section)}
                role="tab"
                type="button"
              >
                {section}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="grid gap-4" aria-labelledby="folders-heading">
        <h2 className="text-xl font-bold text-slate-950" id="folders-heading">Folders</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sectionFolders.map((folder) => <FolderTile folder={folder} key={folder.id} />)}
        </div>
      </section>

      <section className="grid gap-4" aria-labelledby="records-heading">
        <h2 className="text-xl font-bold text-slate-950" id="records-heading">Records in {activeSection}</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sectionDocuments.map((document) => <DocumentTile document={document} key={document.id} onOpen={onOpenDocument} />)}
        </div>
      </section>
    </div>
  );
}
