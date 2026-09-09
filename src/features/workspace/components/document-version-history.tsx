"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, History, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { downloadDocumentVersion, listDocumentVersions, uploadDocumentVersion } from "@/services/documents";
import type { ApiDocumentVersion, ApiVersionOverview } from "@/services/documents";

import type { MockDocument } from "../types";
import { DocumentTypeIcon } from "./document-type-icon";

interface DocumentVersionHistoryProps {
  documentId: string;
  onChanged: () => Promise<void>;
  onNotice: (message: string) => void;
}

const acceptedFiles = ".pdf,.docx,.xlsx,.pptx,.txt,.csv,.png,.jpg,.jpeg";

function extensionOf(filename: string): MockDocument["extension"] {
  const value = filename.split(".").pop()?.toUpperCase();
  if (value === "JPG" || value === "JPEG") return "JPEG";
  return value === "DOCX" || value === "XLSX" || value === "PPTX" || value === "TXT" || value === "CSV" || value === "PNG" ? value : "PDF";
}

function displaySize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentVersionHistory({ documentId, onChanged, onNotice }: DocumentVersionHistoryProps) {
  const [overview, setOverview] = useState<ApiVersionOverview | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async (): Promise<void> => {
    setError(null);
    try { setOverview(await listDocumentVersions(documentId)); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Version history could not be loaded."); }
  }, [documentId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function upload(): Promise<void> {
    if (!selectedFile) { setError("Select a replacement file first."); return; }
    setBusy(true); setError(null);
    try {
      await uploadDocumentVersion(documentId, selectedFile);
      setSelectedFile(null);
      if (fileInput.current) fileInput.current.value = "";
      await Promise.all([load(), onChanged()]);
      onNotice("A new immutable document version was added.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "The new version could not be uploaded."); }
    finally { setBusy(false); }
  }

  async function download(version: ApiDocumentVersion): Promise<void> {
    setDownloading(version.versionNumber); setError(null);
    try { await downloadDocumentVersion(documentId, version.versionNumber, version.originalFilename); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "The selected version could not be downloaded."); }
    finally { setDownloading(null); }
  }

  return (
    <section className="grid gap-4" aria-labelledby="version-history-heading">
      <div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-xl bg-violet-100 text-violet-700"><History aria-hidden="true" size={17} /></span><div><h2 className="font-bold text-slate-950" id="version-history-heading">Version history</h2><p className="mt-0.5 text-xs text-slate-500">Every upload is retained as an immutable version.</p></div></div>

      {overview?.canUploadVersion ? <Card className="grid gap-3 rounded-2xl"><div><h3 className="text-sm font-bold text-slate-900">Upload replacement version</h3><p className="mt-1 text-xs leading-5 text-slate-500">The current file will remain in history. Files are limited to 100 MB and must pass format validation and malware scanning.</p></div><div className="grid gap-3 sm:grid-cols-[1fr_auto]"><label className="grid gap-1.5 text-xs font-semibold text-slate-700">Replacement file<input accept={acceptedFiles} className="h-10 min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-700 file:mr-3 file:border-0 file:bg-transparent file:text-xs file:font-semibold file:text-violet-700" disabled={busy} onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} ref={fileInput} type="file" /></label><Button className="self-end rounded-xl" disabled={!selectedFile || busy} onClick={() => void upload()} size="lg" type="button"><Upload aria-hidden="true" size={16} />{busy ? "Uploading…" : "Upload version"}</Button></div></Card> : null}

      {!overview && !error ? <Card className="rounded-2xl text-sm text-slate-500">Loading version history…</Card> : null}
      {overview?.versions.length === 0 ? <Card className="rounded-2xl text-sm text-slate-500">No document versions are available.</Card> : null}
      <div className="grid gap-3 sm:grid-cols-2">{overview?.versions.map((version) => <Card className="grid gap-3 rounded-2xl" key={version.id}><div className="flex min-w-0 items-start gap-3"><DocumentTypeIcon extension={extensionOf(version.originalFilename)} /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-900">Version {version.versionNumber}</p>{version.versionNumber === overview.currentVersionNumber ? <Badge tone="green">Current</Badge> : null}</div><p className="mt-1 truncate text-xs text-slate-600" title={version.originalFilename}>{version.originalFilename}</p><p className="mt-1 text-xs leading-5 text-slate-500">{displaySize(version.byteSize)} · Uploaded by {version.uploadedBy.firstName} {version.uploadedBy.lastName}<br />{new Date(version.uploadedAt).toLocaleString()}</p></div></div><Button className="w-fit" disabled={downloading !== null} onClick={() => void download(version)} size="sm" type="button" variant="secondary"><Download aria-hidden="true" size={14} />{downloading === version.versionNumber ? "Downloading…" : "Download"}</Button></Card>)}</div>
      {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700" role="alert">{error}</p> : null}
    </section>
  );
}
