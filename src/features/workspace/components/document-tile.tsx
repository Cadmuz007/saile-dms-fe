import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import type { MockDocument, RouteStatus } from "../types";
import { DocumentTypeIcon } from "./document-type-icon";

interface DocumentTileProps {
  document: MockDocument;
  onOpen: (document: MockDocument) => void;
}

const statusTone: Record<RouteStatus, "amber" | "blue" | "green" | "red"> = {
  Pending: "amber",
  Review: "blue",
  Completed: "green",
  Setback: "red",
};

export function DocumentTile({ document, onOpen }: DocumentTileProps) {
  return (
    <button
      className="group grid min-h-40 content-between gap-5 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-[0_12px_26px_-22px_rgba(15,23,42,0.6)] transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_18px_35px_-22px_rgba(109,40,217,0.32)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
      onClick={() => onOpen(document)}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <DocumentTypeIcon extension={document.extension} size="large" />
        <span className="flex items-start gap-2">
          {document.status ? <Badge tone={statusTone[document.status]}>{document.status}</Badge> : null}
          <ArrowUpRight aria-hidden="true" className="mt-0.5 text-slate-300 transition group-hover:text-violet-700" size={16} />
        </span>
      </div>
      <div className="grid gap-1">
        <p className="line-clamp-2 font-semibold leading-5 text-slate-900">{document.title}</p>
        <p className="text-xs text-slate-500">{document.extension} <span aria-hidden="true">·</span> {document.size}</p>
      </div>
    </button>
  );
}
