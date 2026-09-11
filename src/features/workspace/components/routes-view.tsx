"use client";

import { useState } from "react";
import { ArrowRight, Clock3, Eye, Route } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ApiDocument } from "@/services/documents";

import type { WorkflowRoute, WorkflowRouteDirection } from "../workflow.types";
import { WorkflowHistoryPanel } from "./workflow-history-panel";

interface RoutesViewProps {
  routes: WorkflowRoute[];
  onOpenDocument: (document: ApiDocument & { folder: { id: string; name: string } | null }) => void;
  onSignOut: () => void;
}

const statusTone = { ACTIVE: "amber", COMPLETED: "green", CANCELLED: "red", ERROR: "red" } as const;

function formatWhen(value: string | null): string {
  if (!value) return "Not opened";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function RoutesView({ routes, onOpenDocument, onSignOut }: RoutesViewProps) {
  const [direction, setDirection] = useState<WorkflowRouteDirection>("INBOUND");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const visibleRoutes = routes.filter((route) => route.direction === direction);
  const selectedRoute = routes.find((route) => route.id === selectedRouteId) ?? null;
  const inboundCount = routes.filter((route) => route.direction === "INBOUND").length;
  const outboundCount = routes.filter((route) => route.direction === "OUTBOUND").length;
  const completedCount = routes.filter((route) => route.status === "COMPLETED").length;

  return (
    <div className="mx-auto grid w-full max-w-[110rem] gap-7 p-5 sm:p-7 lg:p-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-2"><span className="grid size-10 place-items-center rounded-xl bg-violet-100 text-violet-700"><Route aria-hidden="true" size={20} /></span><div><h1 className="text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-3xl">Routes</h1><p className="mt-1 text-sm text-slate-500">Live workflow records scoped to your assignments and submissions.</p></div></div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm"><span className="size-2 rounded-full bg-amber-500" />{inboundCount} {inboundCount === 1 ? "route needs" : "routes need"} attention</div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Route summary">
        <article className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Inbound</p><p className="mt-2 text-2xl font-bold text-slate-900">{inboundCount}</p><p className="mt-1 text-xs text-violet-700">Awaiting your action</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Outbound</p><p className="mt-2 text-2xl font-bold text-slate-900">{outboundCount}</p><p className="mt-1 text-xs text-slate-400">Workflows you started</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Completed</p><p className="mt-2 text-2xl font-bold text-slate-900">{completedCount}</p><p className="mt-1 text-xs text-emerald-700">Retained in route history</p></article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_36px_-28px_rgba(15,23,42,0.55)]" aria-label="Document route records">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 px-5 pt-4">
          <div className="pb-4"><h2 className="font-bold text-slate-900">Workflow records</h2><p className="mt-0.5 text-xs text-slate-500">Select a record to securely open its document.</p></div>
          <div className="flex" role="tablist" aria-label="Route direction">
            {(["INBOUND", "OUTBOUND"] as const).map((item) => <button aria-selected={direction === item} className="relative h-10 px-4 text-sm font-semibold text-slate-500 after:absolute after:right-3 after:bottom-0 after:left-3 after:h-0.5 after:bg-transparent aria-selected:text-violet-800 aria-selected:after:bg-violet-700" key={item} onClick={() => { setDirection(item); setSelectedRouteId(null); }} role="tab" type="button">{item === "INBOUND" ? "Inbound" : "Outbound"}</button>)}
          </div>
        </div>
        <div className="hidden grid-cols-[minmax(15rem,1.7fr)_0.75fr_0.65fr_minmax(10rem,1fr)_minmax(9rem,1fr)] gap-4 border-b border-slate-100 bg-slate-50/80 px-5 py-3 text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase xl:grid"><span>Record</span><span>Workflow</span><span>Status</span><span>Received / started</span><span>Stage</span></div>
        <div className="divide-y divide-slate-100">
          {visibleRoutes.map((route) => (
            <button aria-pressed={selectedRouteId === route.id} className="grid w-full gap-3 px-5 py-4 text-left transition hover:bg-violet-50/50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet-700 aria-pressed:bg-violet-50 xl:grid-cols-[minmax(15rem,1.7fr)_0.75fr_0.65fr_minmax(10rem,1fr)_minmax(9rem,1fr)] xl:items-center xl:gap-4" key={`${route.direction}:${route.id}`} onClick={() => setSelectedRouteId(route.id)} type="button">
              <span className="grid gap-1"><span className="font-semibold text-slate-900">{route.document.title}</span><span className="flex items-center gap-1 text-xs text-slate-500">{route.direction === "INBOUND" ? `${route.startedBy.firstName} ${route.startedBy.lastName}` : "You"}<ArrowRight aria-hidden="true" size={13} />{route.currentStage?.name ?? (route.status === "ERROR" ? "Needs attention" : "Complete")}</span></span>
              <span className="text-sm text-slate-600">{route.template.name} <span className="text-xs text-slate-400">r{route.templateRevision}</span></span>
              <span><Badge tone={statusTone[route.status]}>{route.status === "ACTIVE" ? "In progress" : route.status === "COMPLETED" ? "Completed" : route.status === "ERROR" ? "Conversion error" : "Cancelled"}</Badge></span>
              <span className="flex items-center gap-1 text-sm text-slate-600"><Clock3 aria-hidden="true" className="text-slate-400" size={15} />{formatWhen(route.direction === "INBOUND" ? route.currentStage?.tasks[0]?.receivedAt ?? null : route.startedAt)}</span>
              <span className="flex items-center gap-1 text-sm text-slate-500"><Eye aria-hidden="true" className="text-slate-400" size={15} />{route.currentStage ? `${route.currentStage.position + 1} of ${route.currentStage.stageCount}` : route.status === "ERROR" ? "Needs attention" : "Finished"}</span>
            </button>
          ))}
          {!visibleRoutes.length ? <div className="px-5 py-12 text-center text-sm text-slate-500">No {direction.toLowerCase()} workflow records yet.</div> : null}
        </div>
      </section>
      {selectedRoute ? <WorkflowHistoryPanel key={selectedRoute.id} onOpenDocument={() => onOpenDocument(selectedRoute.document)} onSignOut={onSignOut} route={selectedRoute} /> : null}
    </div>
  );
}
