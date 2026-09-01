import { ArrowRight, Clock3, Eye, Route } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import type { MockDocument, RouteRecord, RouteStatus } from "../types";

interface RoutesViewProps {
  documents: MockDocument[];
  routes: RouteRecord[];
  onOpenDocument: (document: MockDocument) => void;
}

const statusTone: Record<RouteStatus, "amber" | "blue" | "green" | "red"> = {
  Pending: "amber",
  Review: "blue",
  Completed: "green",
  Setback: "red",
};

export function RoutesView({ documents, routes, onOpenDocument }: RoutesViewProps) {
  return (
    <div className="mx-auto grid w-full max-w-[110rem] gap-7 p-5 sm:p-7 lg:p-8">
      <section className="flex flex-wrap items-end justify-between gap-4"><div className="grid gap-2"><div className="flex items-center gap-2"><span className="grid size-10 place-items-center rounded-xl bg-violet-100 text-violet-700"><Route aria-hidden="true" size={20} /></span><div><h1 className="text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-3xl">Routes</h1><p className="mt-1 text-sm text-slate-500">Monitor records in progress and the next action they require.</p></div></div></div><div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm"><span className="size-2 rounded-full bg-amber-500" />1 route needs attention</div></section>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Route summary"><article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_26px_-22px_rgba(15,23,42,0.5)]"><p className="text-xs text-slate-500">Inbound</p><p className="mt-2 text-2xl font-bold text-slate-900">08</p><p className="mt-1 text-xs text-violet-700">Awaiting action</p></article><article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_26px_-22px_rgba(15,23,42,0.5)]"><p className="text-xs text-slate-500">Outbound</p><p className="mt-2 text-2xl font-bold text-slate-900">15</p><p className="mt-1 text-xs text-slate-400">Sent to recipients</p></article><article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_26px_-22px_rgba(15,23,42,0.5)]"><p className="text-xs text-slate-500">Completed this week</p><p className="mt-2 text-2xl font-bold text-slate-900">28</p><p className="mt-1 text-xs text-emerald-700">Within SLA</p></article></section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_36px_-28px_rgba(15,23,42,0.55)]" aria-label="Document route records">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold text-slate-900">Active routes</h2><p className="mt-0.5 text-xs text-slate-500">Select a route to open its record and preview.</p></div><span className="rounded-sm bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{routes.length} records</span></div>
        <div className="hidden grid-cols-[minmax(15rem,1.7fr)_0.65fr_0.7fr_minmax(8rem,0.9fr)_minmax(9rem,1fr)] gap-4 border-b border-slate-100 bg-slate-50/80 px-5 py-3 text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase xl:grid"><span>Record</span><span>Route</span><span>Status</span><span>Response time</span><span>Stage</span></div>
        <div className="divide-y divide-slate-100">
          {routes.map((route) => {
            const document = documents.find((item) => item.id === route.documentId);
            if (!document) return null;

            return (
              <button className="grid w-full gap-3 px-5 py-4 text-left transition hover:bg-violet-50/50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet-700 xl:grid-cols-[minmax(15rem,1.7fr)_0.65fr_0.7fr_minmax(8rem,0.9fr)_minmax(9rem,1fr)] xl:items-center xl:gap-4" key={route.id} onClick={() => onOpenDocument(document)} type="button">
                <span className="grid gap-1"><span className="font-semibold text-slate-900">{document.title}</span><span className="flex items-center gap-1 text-xs text-slate-500">{route.from}<ArrowRight aria-hidden="true" size={13} />{route.to}</span></span>
                <span className="text-sm text-slate-600">{route.routeType}</span>
                <span><Badge tone={statusTone[route.status]}>{route.status}</Badge></span>
                <span className="flex items-center gap-1 text-sm text-slate-600"><Clock3 aria-hidden="true" className="text-slate-400" size={15} />{route.responseTime}</span>
                <span className="flex items-center gap-1 text-sm text-slate-500"><Eye aria-hidden="true" className="text-slate-400" size={15} />{route.remarks}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
