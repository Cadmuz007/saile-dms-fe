"use client";

import { ArrowLeft, Download, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { downloadDocument } from "@/services/documents";

import type { MockDocument, RouteStatus } from "../types";
import { DocumentTypeIcon } from "./document-type-icon";
import { DocumentVersionHistory } from "./document-version-history";
import { DocumentAttachments } from "./document-attachments";

interface DocumentDetailsProps {
  document: MockDocument;
  onAction: (action: string) => void;
  onBack: () => void;
  canManageAccess?: boolean;
  onManageAccess?: () => void;
  onVersionChanged: () => Promise<void>;
  realtimeRevision: number;
}

const statusTone: Record<RouteStatus, "amber" | "blue" | "green" | "red"> = {
  Pending: "amber",
  Review: "blue",
  Completed: "green",
  Setback: "red",
};

const metadata = (document: MockDocument) => [
  ["Uploaded by", document.uploadedBy],
  ["Date uploaded", document.uploadedAt],
  ["Document type", document.documentType ?? "Unconfigured"],
  ["Classification", document.classification],
  ["Document no.", document.barcode],
  ...document.metadata.map((item) => [item.label, item.value]),
];

export function DocumentDetails({ document, onAction, onBack, canManageAccess, onManageAccess, onVersionChanged, realtimeRevision }: DocumentDetailsProps) {
  async function download(): Promise<void> {
    try { await downloadDocument(document.id, `${document.title}.${document.extension.toLowerCase()}`); }
    catch (error) { onAction(error instanceof Error ? error.message : "Download is unavailable."); }
  }

  return (
    <div className="mx-auto grid w-full max-w-[110rem] gap-7 p-5 sm:p-7 lg:p-8">
      <button className="inline-flex h-9 w-fit items-center gap-2 rounded-lg px-2 text-sm font-semibold text-slate-500 transition hover:bg-white hover:text-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700" onClick={onBack} type="button"><ArrowLeft aria-hidden="true" size={17} />Back to workspace</button>

      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_38px_-28px_rgba(15,23,42,0.55)] sm:p-6">
        <div aria-hidden="true" className="absolute -top-20 -right-10 size-56 rounded-full bg-violet-100/70 blur-3xl" />
        <div className="relative grid gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4"><DocumentTypeIcon extension={document.extension} size="hero" /><div className="flex flex-wrap gap-2"><Badge tone={document.classification === "Classified" ? "purple" : "neutral"}>{document.classification}</Badge>{document.status ? <Badge tone={statusTone[document.status]}>{document.status}</Badge> : null}</div></div>
          <div className="grid gap-2"><p className="text-xs font-bold tracking-[0.12em] text-slate-400 uppercase">{document.extension} record <span aria-hidden="true">·</span> Version {document.version}</p><h1 className="max-w-4xl text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-3xl">{document.title}</h1><p className="max-w-3xl text-sm leading-6 text-slate-500">{document.description}</p></div>
        </div>
      </section>

      <section className="grid gap-4" aria-labelledby="record-description-heading">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-slate-950" id="record-description-heading">Record description</h2><p className="mt-1 text-xs text-slate-500">Reference details for this document</p></div><div className="flex flex-wrap gap-2">{canManageAccess ? <Button onClick={onManageAccess} size="lg" title="Manage private access" variant="secondary"><UsersRound aria-hidden="true" size={16} />Manage access</Button> : null}{document.isLive ? <Button onClick={() => void download()} size="lg" title="Download current version" variant="secondary"><Download aria-hidden="true" size={16} />Download</Button> : null}<Button onClick={() => onAction("Update record")} size="lg" title="Update record" variant="secondary">Update record</Button></div></div>
        <Card className="grid gap-0 overflow-hidden p-0 shadow-[0_12px_26px_-22px_rgba(15,23,42,0.5)] sm:grid-cols-2">
          {metadata(document).map(([label, value]) => <dl className="border-b border-slate-100 p-4 last:border-b-0 sm:nth-[3]:border-b-0 sm:odd:border-r" key={label}><dt className="text-xs text-slate-400">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd></dl>)}
        </Card>
      </section>

      {document.isLive ? <DocumentVersionHistory documentId={document.id} onChanged={onVersionChanged} onNotice={onAction} /> : null}

      {document.isLive ? <DocumentAttachments documentId={document.id} onChanged={onVersionChanged} onNotice={onAction} refreshToken={realtimeRevision} /> : null}
    </div>
  );
}
