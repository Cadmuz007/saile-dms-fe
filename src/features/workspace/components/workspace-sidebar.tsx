import Image from "next/image";
import { FilePlus2, FolderPlus, LockKeyhole, Sparkles, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { LibrarySection, MockDocument, WorkspaceView } from "../types";

interface WorkspaceSidebarProps {
  uploadsBlocked?: boolean;
  activeView: WorkspaceView;
  documents: MockDocument[];
  onCreateRecord: () => void;
  onCreateSection: () => void;
  onNavigate: (view: WorkspaceView) => void;
  onOpenDocument: (document: MockDocument) => void;
}

const sections: Array<{ name: LibrarySection; icon: typeof LockKeyhole; description: string }> = [
  { name: "Home", icon: Sparkles, description: "Your personal workspace" },
  { name: "Private", icon: LockKeyhole, description: "Restricted to authorized teams" },
  { name: "Public", icon: UsersRound, description: "Shared organization records" },
];

export function WorkspaceSidebar({ activeView, documents, uploadsBlocked, onCreateRecord, onCreateSection, onNavigate, onOpenDocument }: WorkspaceSidebarProps) {
  const isSectionView = activeView === "sections";

  return (
    <aside className="flex w-full flex-col border-b border-slate-200/90 bg-white lg:min-h-screen lg:w-56 lg:shrink-0 lg:border-r lg:border-b-0">
      <div className="flex items-center px-5 pt-5 pb-4">
        <Image alt="Saile" className="h-auto w-[6.8rem]" height={44} src="/saile.png" width={110} />
      </div>

      <div className="grid gap-2 px-4">
        <Button disabled={uploadsBlocked} title={uploadsBlocked ? "Storage limit reached. Retained and archived versions still count." : undefined} className="h-10 justify-start gap-2 rounded-xl shadow-sm" onClick={onCreateRecord} variant="default">
          <FilePlus2 aria-hidden="true" size={16} />
          Create record
        </Button>
        <Button className="h-10 justify-start gap-2 rounded-xl text-slate-600" onClick={onCreateSection} variant="ghost">
          <FolderPlus aria-hidden="true" size={16} />
          Create section
        </Button>
      </div>

      <nav aria-label="Document library" className="grid gap-5 px-5 py-6">
        {sections.map((section) => {
          const Icon = section.icon;
          const records = documents.filter((document) => document.section === section.name).slice(0, 3);

          return (
            <section key={section.name}>
              <button
                aria-current={isSectionView ? "page" : undefined}
                className={cn(
                  "group flex w-full items-center gap-2 rounded-lg py-1 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700",
                  isSectionView ? "text-violet-800" : "text-slate-900 hover:text-violet-800",
                )}
                onClick={() => onNavigate("sections")}
                type="button"
              >
                <span className="grid size-6 place-items-center rounded-md bg-slate-100 text-slate-500 transition-colors group-hover:bg-violet-100 group-hover:text-violet-700">
                  <Icon aria-hidden="true" size={13} />
                </span>
                <span className="text-sm font-semibold">{section.name}</span>
              </button>
              <p className="mt-1 pl-8 text-[11px] leading-4 text-slate-400">{section.description}</p>
              <div className="mt-3 grid gap-1.5 pl-8">
                {records.map((document) => (
                  <button
                    className="truncate text-left text-[12px] text-slate-500 transition-colors hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
                    key={document.id}
                    onClick={() => onOpenDocument(document)}
                    title={document.title}
                    type="button"
                  >
                    {document.title}
                  </button>
                ))}
                <button
                  className="mt-1 w-fit text-[12px] font-semibold text-violet-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
                  onClick={() => onNavigate("sections")}
                  type="button"
                >
                  Browse {section.name.toLowerCase()}
                </button>
              </div>
            </section>
          );
        })}
      </nav>

      <footer className="mt-auto border-t border-slate-100 bg-slate-50/70 p-5">
        <div className="flex items-center gap-3">
          <Image alt="Bureau of the Treasury" className="size-9 rounded-full" height={36} src="/btr-logo.png" width={36} />
          <div>
            <p className="text-[11px] font-bold leading-4 text-slate-700">Bureau of the Treasury</p>
            <p className="text-[10px] text-slate-500">Document Management System</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
          <span>License No. 3939205</span>
          <span className="rounded-sm bg-lime-500 px-2.5 py-0.5 font-bold text-white">Active</span>
        </div>
      </footer>
    </aside>
  );
}
