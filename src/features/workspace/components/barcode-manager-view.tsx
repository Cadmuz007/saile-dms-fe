"use client";

import { useEffect, useState } from "react";
import { Barcode, FolderOpen, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty } from "@/components/ui/combobox";
import { listBarcodes, type ApiBarcodeManagerRow } from "@/services/documents";

export function BarcodeManagerView({ onManage }: { onManage: (documentId: string, documentTitle: string) => void }) {
  const [state, setState] = useState<{ rows: ApiBarcodeManagerRow[]; error: string | null } | null>(null);
  const [revision, setRevision] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => { const controller = new AbortController(); listBarcodes(controller.signal).then((rows) => { if (!controller.signal.aborted) setState({ rows, error: null }); }).catch((error) => { if (!controller.signal.aborted) setState({ rows: [], error: error instanceof Error ? error.message : "Barcode Manager is unavailable." }); }); return () => controller.abort(); }, [revision]);
  const rows = state?.rows.filter((row) => { const query = search.trim().toLocaleLowerCase(); return !query || row.title.toLocaleLowerCase().includes(query) || row.barcodes[0]?.barcodeValue.includes(query); }) ?? [];
  return <div className="mx-auto grid w-full max-w-6xl gap-6 p-5 sm:p-7 lg:p-8"><header><p className="text-xs font-bold tracking-[0.12em] text-violet-700 uppercase">Utilities</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Barcode Manager</h1><p className="mt-2 text-sm text-slate-500">Generate, print, reprint, and inspect retained barcode revisions for documents you can access.</p></header>
    <div className="grid max-w-xl gap-2">
      <label className="text-sm font-semibold text-slate-700" htmlFor="barcode-document-search">Select a document title</label>
      <Combobox items={state?.rows.map((row) => row.id) ?? []} value={selectedId}
        itemToStringLabel={(id) => { const row = state?.rows.find((item) => item.id === id); return row ? `${row.title} — ${row.area} / ${row.folder?.name ?? "Root"} — ${row.owner.firstName} ${row.owner.lastName}` : ""; }}
        onValueChange={(id) => setSelectedId(id)}>
        <ComboboxInput id="barcode-document-search" placeholder="Search existing document titles…" showClear disabled={!state || Boolean(state.error)} />
        <ComboboxContent><ComboboxEmpty>No matching documents.</ComboboxEmpty><ComboboxList>{(id: string) => {
          const row = state?.rows.find((item) => item.id === id);
          return row ? <ComboboxItem key={id} value={id}><span><span className="block font-semibold">{row.title}</span><span className="block text-xs text-slate-500">{row.area} / {row.folder?.name ?? "Root"} · {row.owner.firstName} {row.owner.lastName}</span></span></ComboboxItem> : null;
        }}</ComboboxList></ComboboxContent>
      </Combobox>
      <Button className="w-fit" disabled={!selectedId} onClick={() => { const row = state?.rows.find((item) => item.id === selectedId); if (row) onManage(row.id, row.title); }}>Manage selected document</Button>
      <label className="mt-3 text-sm font-semibold text-slate-700" htmlFor="barcode-table-search">Filter document list</label>
      <input className="h-10 rounded-lg border border-slate-300 px-3 text-sm" id="barcode-table-search" onChange={(event) => setSearch(event.target.value)} placeholder="Title or barcode number" type="search" value={search} />
    </div>
    {!state ? <p className="rounded-xl bg-white p-5 text-sm text-slate-500">Loading accessible documents…</p> : null}
    {state?.error ? <div className="flex items-center justify-between gap-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-700" role="alert"><span>{state.error}</span><Button onClick={() => setRevision((value) => value + 1)} size="sm" variant="secondary"><RefreshCw aria-hidden="true" size={15} />Retry</Button></div> : null}
    {state && !state.error && rows.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">{state.rows.length ? "No documents match your search." : "No accessible documents are available for barcode management."}</p> : null}
    {rows.length ? <div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-3">Document</th><th className="p-3">Location</th><th className="p-3">Current barcode</th><th className="p-3">Revision</th><th className="p-3"><span className="sr-only">Action</span></th></tr></thead><tbody>{rows.map((row) => { const current = row.barcodes[0]; return <tr className="border-t border-slate-100" key={row.id}><td className="p-3"><p className="font-semibold text-slate-900">{row.title}</p><p className="text-xs text-slate-500">Owner: {row.owner.firstName} {row.owner.lastName}</p></td><td className="p-3 text-slate-600"><span className="inline-flex items-center gap-1"><FolderOpen aria-hidden="true" size={14} />{row.area}{row.folder ? ` / ${row.folder.name}` : " / Root"}</span></td><td className="p-3 font-mono text-xs">{current?.barcodeValue ?? "Not generated"}</td><td className="p-3 text-slate-600">{current ? current.revision : "—"}</td><td className="p-3 text-right"><Button onClick={() => onManage(row.id, row.title)} size="sm" variant="secondary"><Barcode aria-hidden="true" size={15} />Manage</Button></td></tr>; })}</tbody></table></div> : null}
  </div>;
}
