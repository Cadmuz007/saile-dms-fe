"use client";

import { useCallback, useEffect, useState } from "react";
import { Barcode, History, Printer, RefreshCw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { generateDocumentBarcode, getDocumentBarcode, printGeneratedBarcode, reprintDocumentBarcode, type ApiBarcodeOverview } from "@/services/documents";
import { code128Svg, printBarcodeLabels } from "../printing";

interface BarcodeDialogProps {
  documentId: string;
  documentTitle: string;
  canGenerate: boolean;
  canPrint: boolean;
  canReprint: boolean;
  onChanged: () => Promise<void>;
  onClose: () => void;
  onNotice: (message: string | null) => void;
}

export function BarcodeDialog(props: BarcodeDialogProps) {
  const [overview, setOverview] = useState<ApiBarcodeOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copies, setCopies] = useState(3);
  const load = useCallback(async () => { try { setOverview(await getDocumentBarcode(props.documentId)); } catch (requestError) { setOverview(null); setError(requestError instanceof Error ? requestError.message : "Barcode details are unavailable."); } }, [props.documentId]);
  useEffect(() => { const controller = new AbortController(); getDocumentBarcode(props.documentId).then((data) => { if (!controller.signal.aborted) setOverview(data); }).catch((requestError) => { if (!controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : "Barcode details are unavailable."); }); return () => controller.abort(); }, [props.documentId]);
  const current = overview?.barcodes.find((item) => item.isCurrent) ?? null;
  const initiallyPrinted = Boolean(current?.printEvents?.length);

  async function generate() {
    if (current && !window.confirm(`Regenerate the barcode for “${props.documentTitle}”? The current value will be retired but retained in history.`)) return;
    setBusy(true); setError(null);
    try {
      const generated = await generateDocumentBarcode(props.documentId, current?.revision ?? 0);
      if (props.canPrint) {
        const receipt = await printGeneratedBarcode(props.documentId, generated.revision);
        printBarcodeLabels(receipt.document.title, receipt.barcode.barcodeValue, receipt.event.copies);
        props.onNotice(`Barcode ${generated.barcodeValue} was generated and its three-label initial print request was audited.`);
      } else props.onNotice(`Barcode ${generated.barcodeValue} was generated. A user with barcode print permission can print it.`);
      await Promise.all([load(), props.onChanged()]);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "The barcode could not be generated."); }
    finally { await Promise.all([load(), props.onChanged().catch(() => undefined)]); setBusy(false); }
  }

  async function initialPrint() {
    setBusy(true); setError(null);
    try { const receipt = await printGeneratedBarcode(props.documentId, current!.revision); printBarcodeLabels(receipt.document.title, receipt.barcode.barcodeValue, receipt.event.copies); props.onNotice("The initial three-label barcode print request was audited."); await load(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "The barcode could not be printed."); }
    finally { await load(); setBusy(false); }
  }

  async function reprint() {
    setBusy(true); setError(null);
    try { const receipt = await reprintDocumentBarcode(props.documentId, current!.revision, copies); printBarcodeLabels(receipt.document.title, receipt.barcode.barcodeValue, receipt.event.copies); props.onNotice(`${copies} barcode ${copies === 1 ? "copy was" : "copies were"} requested and audited.`); await load(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "The barcode could not be reprinted."); }
    finally { await load(); setBusy(false); }
  }

  return <Dialog open onOpenChange={(open) => { if (!open && !busy) props.onClose(); }}>
    <DialogContent showCloseButton={false} className="flex max-h-[92vh] w-full flex-col gap-0 overflow-hidden bg-white p-0 sm:max-w-2xl">
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 p-5"><div className="flex gap-3"><span className="grid size-10 place-items-center rounded-xl bg-violet-100 text-violet-700"><Barcode aria-hidden="true" size={21} /></span><div><DialogTitle className="text-xl font-bold">Barcode controls</DialogTitle><DialogDescription className="mt-1 text-sm text-slate-500">{props.documentTitle}</DialogDescription></div></div><button aria-label="Close barcode controls" className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" disabled={busy} onClick={props.onClose} type="button"><X aria-hidden="true" size={19} /></button></header>
      <div className="grid gap-5 overflow-y-auto p-5">
        {overview?.printEvents?.length ? <section><h3 className="font-bold">Document print requests</h3><ol className="mt-2 grid gap-2">{overview.printEvents.map((event) => <li className="rounded-lg border border-slate-200 p-3 text-xs" key={event.id}>Version {event.documentVersion} · {event.copies} copy requested · {event.performedBy.firstName} {event.performedBy.lastName} · {new Date(event.occurredAt).toLocaleString()}</li>)}</ol></section> : null}
        <p className="text-xs text-slate-500">Print requests are audited even if you cancel the print dialog. Physical printing is not confirmed by this application.</p>
        {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">{error}</p> : null}
        {!overview && !error ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Loading barcode details…</p> : null}
        {overview && !current ? <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center"><p className="font-semibold">No barcode has been generated</p><p className="mt-1 text-sm text-slate-500">The server will assign the next unique Code 128 value.</p>{props.canGenerate ? <Button className="mt-4" disabled={busy} onClick={() => void generate()}><Barcode aria-hidden="true" size={16} />{props.canPrint ? "Generate and print 3" : "Generate barcode"}</Button> : <p className="mt-4 text-sm text-amber-700">Barcode generation permission is required.</p>}</div> : null}
        {current ? <div className="grid gap-4"><div className="rounded-xl border border-slate-200 p-4"><div dangerouslySetInnerHTML={{ __html: code128Svg(current.barcodeValue) }} /><div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500"><span>Revision {current.revision} · Code 128</span><span>{new Date(current.generatedAt).toLocaleString()}</span></div></div><div className="flex flex-wrap gap-2">{props.canGenerate ? <Button disabled={busy} onClick={() => void generate()} variant="secondary"><RefreshCw aria-hidden="true" size={16} />Regenerate{props.canPrint ? " and print 3" : ""}</Button> : null}{!initiallyPrinted && props.canPrint ? <Button disabled={busy} onClick={() => void initialPrint()}><Printer aria-hidden="true" size={16} />Print initial 3</Button> : null}</div>{initiallyPrinted ? <div className="grid gap-2 rounded-xl bg-slate-50 p-4"><label className="text-sm font-semibold" htmlFor="barcode-copy-count">Number of reprint copies</label><div className="flex gap-2"><input className="h-10 w-28 rounded-lg border border-slate-300 px-3" id="barcode-copy-count" max={100} min={1} onChange={(event) => setCopies(Math.min(100, Math.max(1, Math.trunc(Number(event.target.value)) || 1)))} type="number" value={copies} />{props.canReprint ? <Button disabled={busy} onClick={() => void reprint()}><Printer aria-hidden="true" size={16} />Reprint</Button> : <p className="self-center text-sm text-amber-700">Reprint permission is required.</p>}</div></div> : null}</div> : null}
        {overview?.barcodes.length ? <section><h3 className="flex items-center gap-2 font-bold"><History aria-hidden="true" size={17} />Revision and print history</h3><ol className="mt-3 grid gap-2">{overview.barcodes.map((item) => <li className="rounded-xl border border-slate-200 p-3" key={item.id}><div className="flex flex-wrap justify-between gap-2"><span className="font-mono text-sm font-semibold">{item.barcodeValue}</span><span className="text-xs text-slate-500">Revision {item.revision}{item.isCurrent ? " · Current" : " · Retired"}</span></div><p className="mt-1 text-xs text-slate-500">Generated by {item.generatedBy?.firstName} {item.generatedBy?.lastName} · {new Date(item.generatedAt).toLocaleString()}</p>{item.printEvents?.map((event) => <p className="mt-1 text-xs text-slate-600" key={event.id}>{event.actionType === "PRINT_BARCODE" ? "Initial print requested" : "Reprint requested"}: {event.copies} {event.copies === 1 ? "copy" : "copies"} · {event.performedBy.firstName} {event.performedBy.lastName} · {new Date(event.occurredAt).toLocaleString()}</p>)}</li>)}</ol></section> : null}
      </div>
    </DialogContent>
  </Dialog>;
}
