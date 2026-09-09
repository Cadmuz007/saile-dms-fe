"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Eye, Paperclip, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { downloadAttachmentVersion, listAttachments, previewAttachmentVersion, uploadAttachment, uploadAttachmentVersion } from "@/services/attachments";
import type { ApiAttachment, ApiAttachmentOverview, ApiAttachmentVersion } from "@/services/attachments";

const acceptedFiles = ".pdf,.docx,.xlsx,.pptx,.txt,.csv,.png,.jpg,.jpeg";
const maximumAttachmentBytes = 25 * 1024 * 1024;

interface DocumentAttachmentsProps { documentId: string; refreshToken: number; onChanged: () => Promise<void>; onNotice: (message: string) => void; }

function displaySize(bytes: number): string { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }
function canPreview(version: ApiAttachmentVersion): boolean { return version.detectedMimeType === "application/pdf" || version.detectedMimeType.startsWith("image/"); }

function AttachmentCard({ attachment, canMutate, onReload, onNotice }: { attachment: ApiAttachment; canMutate: boolean; onReload: () => Promise<void>; onNotice: (message: string) => void }) {
  const [file, setFile] = useState<File | null>(null); const [busy, setBusy] = useState(false); const [activeAction, setActiveAction] = useState<string | null>(null); const [error, setError] = useState<string | null>(null); const input = useRef<HTMLInputElement>(null);
  async function replace(): Promise<void> {
    if (!file) return;
    if (file.size > maximumAttachmentBytes) { setError("An attachment must not exceed 25 MB."); return; }
    setBusy(true); setError(null);
    try { await uploadAttachmentVersion(attachment.id, file); setFile(null); if (input.current) input.current.value = ""; await onReload(); onNotice(`A new immutable version of ${attachment.name} was added.`); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "The attachment version could not be uploaded."); }
    finally { setBusy(false); }
  }
  async function act(version: ApiAttachmentVersion, action: "download" | "preview"): Promise<void> {
    setActiveAction(`${action}:${version.versionNumber}`); setError(null);
    try { if (action === "download") await downloadAttachmentVersion(attachment.id, version); else await previewAttachmentVersion(attachment.id, version.versionNumber); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : `Attachment ${action} is unavailable.`); }
    finally { setActiveAction(null); }
  }
  return <Card className="grid gap-4 rounded-2xl"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">{attachment.name}</h3><p className="mt-1 text-xs text-slate-500">Created by {attachment.createdBy.firstName} {attachment.createdBy.lastName} · {attachment.versions.length} immutable {attachment.versions.length === 1 ? "version" : "versions"}</p></div><Badge tone="neutral">Attachment</Badge></div>{canMutate ? <div className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-700">Upload replacement version</p><div className="grid gap-2 sm:grid-cols-[1fr_auto]"><input accept={acceptedFiles} aria-label={`Replacement file for ${attachment.name}`} className="h-9 min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs file:mr-2 file:border-0 file:bg-transparent file:font-semibold file:text-violet-700" disabled={busy} onChange={(event) => setFile(event.target.files?.[0] ?? null)} ref={input} type="file" /><Button disabled={!file || busy} onClick={() => void replace()} size="sm" type="button"><Upload aria-hidden="true" size={14} />{busy ? "Uploading…" : "Add version"}</Button></div></div> : null}<div className="grid gap-2">{attachment.versions.map((version) => <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-3" key={version.id}><div><div className="flex items-center gap-2"><p className="text-sm font-semibold text-slate-800">Version {version.versionNumber}</p>{version.versionNumber === attachment.currentVersionNumber ? <Badge tone="green">Current</Badge> : null}</div><p className="mt-1 text-xs text-slate-500">{version.originalFilename} · {displaySize(version.byteSize)}<br />{version.uploadedBy.firstName} {version.uploadedBy.lastName} · {new Date(version.uploadedAt).toLocaleString()}</p></div><div className="flex gap-2">{canPreview(version) ? <Button disabled={activeAction !== null} onClick={() => void act(version, "preview")} size="sm" type="button" variant="secondary"><Eye aria-hidden="true" size={14} />{activeAction === `preview:${version.versionNumber}` ? "Opening…" : "Preview"}</Button> : null}<Button disabled={activeAction !== null} onClick={() => void act(version, "download")} size="sm" type="button" variant="secondary"><Download aria-hidden="true" size={14} />{activeAction === `download:${version.versionNumber}` ? "Downloading…" : "Download"}</Button></div></div>)}</div>{error ? <p className="rounded-lg bg-rose-50 p-2 text-xs font-medium text-rose-700" role="alert">{error}</p> : null}</Card>;
}

export function DocumentAttachments({ documentId, refreshToken, onChanged, onNotice }: DocumentAttachmentsProps) {
  const [overview, setOverview] = useState<ApiAttachmentOverview | null>(null); const [name, setName] = useState(""); const [file, setFile] = useState<File | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null); const input = useRef<HTMLInputElement>(null);
  const load = useCallback(async () => { setError(null); try { setOverview(await listAttachments(documentId)); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Attachments could not be loaded."); } }, [documentId]);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load, refreshToken]);
  async function add(): Promise<void> {
    if (!file) { setError("Select an attachment file first."); return; }
    if (file.size > maximumAttachmentBytes) { setError("An attachment must not exceed 25 MB."); return; }
    setBusy(true); setError(null);
    try { await uploadAttachment(documentId, { name: name || undefined, file }); setName(""); setFile(null); if (input.current) input.current.value = ""; await Promise.all([load(), onChanged()]); onNotice("The attachment was securely added."); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "The attachment could not be uploaded."); }
    finally { setBusy(false); }
  }
  return <section className="grid gap-4" aria-labelledby="attachments-heading"><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-xl bg-slate-100 text-slate-600"><Paperclip aria-hidden="true" size={17} /></span><div><h2 className="font-bold text-slate-950" id="attachments-heading">Attachments</h2><p className="mt-0.5 text-xs text-slate-500">Supporting files with retained immutable version history.</p></div></div>{overview?.canMutateAttachments ? <Card className="grid gap-3 rounded-2xl"><div><h3 className="text-sm font-bold text-slate-900">Add attachment</h3><p className="mt-1 text-xs text-slate-500">Up to 25 MB. The file must pass format validation and malware scanning.</p></div><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-xs font-semibold text-slate-700">Attachment name <span className="font-normal text-slate-400">(optional)</span><input className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-normal" disabled={busy} maxLength={200} onChange={(event) => setName(event.target.value)} placeholder="Defaults to the filename" value={name} /></label><label className="grid gap-1.5 text-xs font-semibold text-slate-700">File<input accept={acceptedFiles} className="h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal file:mr-3 file:border-0 file:bg-transparent file:text-xs file:font-semibold file:text-violet-700" disabled={busy} onChange={(event) => setFile(event.target.files?.[0] ?? null)} ref={input} type="file" /></label></div><Button className="w-fit" disabled={!file || busy} onClick={() => void add()} type="button"><Upload aria-hidden="true" size={15} />{busy ? "Uploading…" : "Add attachment"}</Button></Card> : null}{!overview && !error ? <Card className="rounded-2xl text-sm text-slate-500">Loading attachments…</Card> : null}{overview?.attachments.length === 0 ? <Card className="rounded-2xl text-sm text-slate-500">No attachments have been added to this document.</Card> : null}<div className="grid gap-3">{overview?.attachments.map((attachment) => <AttachmentCard attachment={attachment} canMutate={overview.canMutateAttachments} key={attachment.id} onNotice={onNotice} onReload={async () => { await Promise.all([load(), onChanged()]); }} />)}</div>{error ? <p className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700" role="alert">{error}</p> : null}</section>;
}
