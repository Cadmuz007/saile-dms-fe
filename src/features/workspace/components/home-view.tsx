"use client";

import { useState } from "react";

import { ArrowRight, CheckCircle2, CircleAlert, Clock3, FolderClock, Inbox, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { Folder, MockDocument, RouteRecord } from "../types";
import { DocumentTile } from "./document-tile";
import { FolderTile } from "./folder-tile";

interface HomeViewProps {
  documents: MockDocument[];
  folders: Folder[];
  routes: RouteRecord[];
  onCreateRecord: () => void;
  onOpenDocument: (document: MockDocument) => void;
  onShowRoutes: () => void;
}

const attentionItems = [
  { label: "For your review", value: "04", icon: Clock3, tone: "text-amber-700 bg-amber-50 border-amber-100" },
  { label: "Routed today", value: "12", icon: ArrowRight, tone: "text-violet-700 bg-violet-50 border-violet-100" },
  { label: "Completed this week", value: "28", icon: CheckCircle2, tone: "text-emerald-700 bg-emerald-50 border-emerald-100" },
];

export function HomeView({ documents, folders, routes, onCreateRecord, onOpenDocument, onShowRoutes }: HomeViewProps) {
  const [routeType, setRouteType] = useState<"Inbound" | "Outbound">("Inbound");
  const inboxDocuments = routes
    .filter((route) => route.routeType === routeType)
    .map((route) => documents.find((document) => document.id === route.documentId))
    .filter((document): document is MockDocument => Boolean(document));

  return (
    <div className="mx-auto grid w-full max-w-[110rem] gap-8 p-5 sm:p-7 lg:p-8">
      <section className="flex flex-wrap items-start justify-between gap-5">
        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <Badge tone="purple">Workspace overview</Badge>
            <span className="text-xs text-slate-400">September 2, 2026</span>
          </div>
          <h1 className="text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-[2rem]">Good afternoon, Alex.</h1>
          <p className="max-w-xl text-sm leading-6 text-slate-500">
            Here is a clear view of the records and approvals that need your attention today.
          </p>
        </div>
        <Button className="h-10 gap-2 rounded-xl px-4 shadow-sm" onClick={onCreateRecord} variant="default">
          <Plus aria-hidden="true" size={16} />
          Create record
        </Button>
      </section>

      <section aria-label="Workspace summary" className="grid gap-3 sm:grid-cols-3">
        {attentionItems.map((item) => {
          const Icon = item.icon;
          return (
            <article className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.5)]" key={item.label}>
              <span className={`grid size-9 place-items-center rounded-xl border ${item.tone}`}><Icon aria-hidden="true" size={17} /></span>
              <div className="min-w-0"><p className="text-lg font-bold tracking-tight text-slate-900">{item.value}</p><p className="truncate text-xs text-slate-500">{item.label}</p></div>
            </article>
          );
        })}
      </section>

      <section aria-labelledby="inbox-heading" className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-violet-100 text-violet-700"><Inbox aria-hidden="true" size={18} /></span>
            <div><h2 className="font-bold text-slate-950" id="inbox-heading">Inbox</h2><p className="text-xs text-slate-500">Documents moving through your routes</p></div>
          </div>
          <button className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700" onClick={onShowRoutes} type="button">
            View all routes <ArrowRight aria-hidden="true" size={16} />
          </button>
        </div>

        <div className="flex items-end justify-between gap-3 border-b border-slate-200">
          <div className="flex" role="tablist" aria-label="Inbox route types">
            {(["Inbound", "Outbound"] as const).map((item) => (
              <button
                aria-selected={routeType === item}
                className="relative h-10 px-4 text-sm font-semibold text-slate-500 transition-colors after:absolute after:right-3 after:bottom-0 after:left-3 after:h-0.5 after:rounded-full after:bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 aria-selected:text-violet-800 aria-selected:after:bg-violet-700"
                key={item}
                onClick={() => setRouteType(item)}
                role="tab"
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
          {routeType === "Inbound" ? <span className="mb-2 hidden items-center gap-1 text-xs text-amber-700 sm:flex"><CircleAlert aria-hidden="true" size={14} />1 route needs attention</span> : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {inboxDocuments.map((document) => <DocumentTile document={document} key={document.id} onOpen={onOpenDocument} />)}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(17rem,0.85fr)]">
        <div className="grid gap-4" aria-labelledby="recent-records-heading">
          <div className="flex items-center gap-2"><FolderClock aria-hidden="true" className="text-violet-700" size={19} /><h2 className="font-bold text-slate-950" id="recent-records-heading">Recently created records</h2></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {documents.slice(0, 3).map((document) => <DocumentTile document={document} key={document.id} onOpen={onOpenDocument} />)}
          </div>
        </div>
        <div className="grid gap-4" aria-labelledby="recent-sections-heading">
          <div className="flex items-center gap-2"><FolderClock aria-hidden="true" className="text-violet-700" size={19} /><h2 className="font-bold text-slate-950" id="recent-sections-heading">Recent sections</h2></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {folders.slice(0, 2).map((folder) => <FolderTile folder={folder} key={folder.id} />)}
          </div>
        </div>
      </section>
    </div>
  );
}
