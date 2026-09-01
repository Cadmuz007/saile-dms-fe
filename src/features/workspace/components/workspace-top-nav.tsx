import { Archive, Bell, ChevronDown, FolderOpen, HardDrive, Home, Route, Search, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

import type { WorkspaceView } from "../types";

interface WorkspaceTopNavProps {
  activeView: WorkspaceView;
  onNavigate: (view: WorkspaceView) => void;
  onShowSearch: () => void;
}

const navItems = [
  { view: "home", label: "Home", icon: Home },
  { view: "sections", label: "Sections", icon: FolderOpen },
  { view: "routes", label: "Routes", icon: Route },
  { view: "archives", label: "Archives", icon: Archive },
  { view: "trash", label: "Trash bin", icon: Trash2 },
] as const;

export function WorkspaceTopNav({ activeView, onNavigate, onShowSearch }: WorkspaceTopNavProps) {
  return (
    <header className="flex min-h-[5.25rem] flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 bg-white/85 px-5 py-3 backdrop-blur lg:px-7">
      <nav aria-label="Primary workspace navigation" className="flex flex-wrap gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;

          return (
            <button
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group grid min-h-14 min-w-16 place-items-center gap-1 rounded-xl px-2 text-[11px] font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700",
                isActive
                  ? "bg-violet-50 text-violet-800 shadow-sm ring-1 ring-violet-100"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-950",
              )}
              key={item.view}
              onClick={() => onNavigate(item.view)}
              type="button"
            >
              <Icon aria-hidden="true" className={cn("transition-transform group-hover:-translate-y-0.5", isActive && "text-violet-700")} size={19} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <button
          aria-label="Show AI search"
          className="grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-600 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
          onClick={onShowSearch}
          type="button"
        >
          <Search aria-hidden="true" size={18} />
        </button>
        <button
          aria-label="Notifications"
          className="relative grid size-9 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
          title="Notifications"
          type="button"
        >
          <Bell aria-hidden="true" size={18} />
          <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-violet-600 ring-2 ring-white" />
        </button>
        <div className="hidden items-center gap-2 border-l border-slate-200 pl-3 sm:flex">
          <HardDrive aria-hidden="true" className="text-violet-700" size={17} />
          <div className="leading-tight">
            <p className="text-[11px] font-semibold text-slate-700">455 MB <span className="font-normal text-slate-400">of 5 GB</span></p>
            <div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-[9%] rounded-full bg-violet-600" /></div>
          </div>
        </div>
        <button className="flex items-center gap-2 rounded-xl px-1.5 py-1 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700" type="button">
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-violet-700 to-fuchsia-600 text-[11px] font-bold text-white shadow-sm">AR</span>
          <span className="hidden text-left lg:block"><span className="block text-xs font-semibold text-slate-800">Alex Rivera</span><span className="block text-[10px] text-slate-500">Records Officer</span></span>
          <ChevronDown aria-hidden="true" className="hidden text-slate-400 lg:block" size={15} />
        </button>
      </div>
    </header>
  );
}
