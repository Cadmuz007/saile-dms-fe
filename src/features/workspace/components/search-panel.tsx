"use client";

import Image from "next/image";
import { Mic, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { MockDocument } from "../types";
import { DocumentTypeIcon } from "./document-type-icon";

interface SearchPanelProps {
  documents: MockDocument[];
  onOpenDocument: (document: MockDocument) => void;
}

export function SearchPanel({ documents, onOpenDocument }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return documents.slice(0, 3);

    return documents.filter((document) =>
      [document.title, document.subject, document.folder, document.description]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [documents, query]);

  return (
    <aside aria-label="AI document search" className="grid h-full content-start gap-6 overflow-y-auto bg-[radial-gradient(circle_at_50%_0%,rgba(249, 247, 255, 0.1),transparent_13rem)] p-5 sm:p-6">
      <div className="grid justify-items-center gap-3 pt-4 text-center">
        <div className="relative h-12 w-40 overflow-hidden">
          <Image alt="Sail AI" className="object-cover object-center" fill sizes="10rem" src="/sail-ai.png" />
        </div>
        {/* <div className="grid gap-1"><p className="text-xl font-bold tracking-tight text-slate-950">Set Sail AI</p><p className="max-w-xs text-sm leading-6 text-slate-500">Find records, folders, and topics across your workspace.</p></div> */}
      </div>

      <label className="relative block">
        <span className="sr-only">Search records</span>
        <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white py-3 pr-12 pl-11 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="What's on your mind?"
          type="search"
          value={query}
        />
        <span aria-hidden="true" className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-xl text-slate-400"><Mic size={17} /></span>
      </label>

      <section className="grid gap-3" aria-live="polite">
        <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-bold text-slate-800">{query.trim() ? "Matching records" : "Suggested for you"}</h2><Badge tone="purple">AI Search</Badge></div>
        {results.length > 0 ? (
          results.map((document) => (
            <article className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_12px_26px_-22px_rgba(15,23,42,0.6)]" key={document.id}>
              <div className="flex gap-3"><DocumentTypeIcon extension={document.extension} size="small" /><div className="min-w-0"><h3 className="truncate text-sm font-semibold text-slate-900">{document.title}</h3><p className="mt-0.5 truncate text-xs text-slate-500">{document.folder} <span aria-hidden="true">·</span> {document.extension}</p></div></div>
              <div className="flex items-center justify-between gap-3"><Badge tone={document.classification === "Classified" ? "purple" : "neutral"}>{document.classification}</Badge><Button className="h-8 rounded-lg px-3 text-xs" onClick={() => onOpenDocument(document)} variant="secondary">Open</Button></div>
            </article>
          ))
        ) : (
          <article className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-center text-sm leading-6 text-slate-500">No records match that search. Try “report”, “budget”, or “proposal”.</article>
        )}
      </section>

    </aside>
  );
}
