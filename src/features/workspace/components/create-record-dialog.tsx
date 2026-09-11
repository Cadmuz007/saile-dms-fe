"use client";

import { FileUp, FolderOpen, X } from "lucide-react";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AvailableDocumentType } from "@/features/admin/document-types.types";

import type { LibrarySection, MockDocument } from "../types";

const recordSchema = z.object({
  title: z.string().trim().min(3, "Enter at least 3 characters.").max(120, "Use 120 characters or fewer."),
  section: z.enum(["Home", "Private", "Public"]),
  classification: z.enum(["Unclassified", "Classified"]),
  documentTypeId: z.string(),
});

type RecordFormValues = z.infer<typeof recordSchema>;

interface CreateRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentTypes: AvailableDocumentType[];
  onCreate: (record: { title: string; section: LibrarySection; classification: MockDocument["classification"]; documentTypeId?: string; metadata: Array<{ fieldId: string; value: string }>; file: File }) => Promise<void>;
}

const acceptedFiles = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "text/plain": [".txt"],
  "text/csv": [".csv"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
};

function displaySize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CreateRecordDialog({ open, onOpenChange, documentTypes, onCreate }: CreateRecordDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [metadataValues, setMetadataValues] = useState<Record<string, string>>({});
  const [metadataErrors, setMetadataErrors] = useState<Record<string, string>>({});
  const { control, register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<RecordFormValues>({
    resolver: zodResolver(recordSchema),
    defaultValues: { title: "", section: "Home", classification: "Unclassified", documentTypeId: "" },
  });
  const selectedDocumentTypeId = useWatch({ control, name: "documentTypeId" });
  const selectedDocumentType = documentTypes.find((documentType) => documentType.id === selectedDocumentTypeId);
  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    accept: acceptedFiles,
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024,
    multiple: false,
    onDropAccepted: ([file]) => { setSelectedFile(file); setFileError(null); },
    onDropRejected: ([rejection]) => { setSelectedFile(null); setFileError(rejection?.errors[0]?.message ?? "Choose one supported file under 100 MB."); },
  });

  function closeDialog(): void {
    reset();
    setSelectedFile(null);
    setFileError(null);
    setMetadataValues({});
    setMetadataErrors({});
    onOpenChange(false);
  }

  async function submit(values: RecordFormValues): Promise<void> {
    if (!selectedFile) { setFileError("Choose a primary document file."); return; }
    const nextMetadataErrors: Record<string, string> = {};
    for (const field of selectedDocumentType?.fields ?? []) if (field.isRequired && !metadataValues[field.id]?.trim()) nextMetadataErrors[field.id] = `${field.label} is required.`;
    setMetadataErrors(nextMetadataErrors);
    if (Object.keys(nextMetadataErrors).length) return;
    try {
      await onCreate({ title: values.title, section: values.section as LibrarySection, classification: values.classification, documentTypeId: values.documentTypeId || undefined,
        metadata: (selectedDocumentType?.fields ?? []).flatMap((field) => metadataValues[field.id]?.trim() ? [{ fieldId: field.id, value: metadataValues[field.id] }] : []), file: selectedFile });
      closeDialog();
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "The document could not be uploaded.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm" role="presentation">
      <section aria-describedby="create-record-description" aria-labelledby="create-record-title" aria-modal="true" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl" role="dialog">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6"><div><p className="text-xs font-bold tracking-[0.12em] text-violet-700 uppercase">Records</p><h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950" id="create-record-title">Create record</h2><p className="mt-1 text-sm text-slate-500" id="create-record-description">Add document information to your workspace.</p></div><button aria-label="Close create record dialog" className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700" onClick={closeDialog} type="button"><X aria-hidden="true" size={19} /></button></div>
        <form className="grid gap-5 p-5 sm:p-6" onSubmit={handleSubmit(submit)}>
          <div className="grid gap-2"><label className="text-sm font-semibold text-slate-800" htmlFor="record-title">Record title</label><input aria-invalid={Boolean(errors.title)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 aria-invalid:border-rose-400" id="record-title" placeholder="e.g. Financial Performance Report Q3" {...register("title")} />{errors.title ? <p className="text-xs font-medium text-rose-600" role="alert">{errors.title.message}</p> : null}</div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><label className="text-sm font-semibold text-slate-800" htmlFor="record-section">Section</label><select className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100" id="record-section" {...register("section")}><option value="Home">Home</option><option value="Private">Private</option><option value="Public">Public</option></select></div><div className="grid gap-2"><label className="text-sm font-semibold text-slate-800" htmlFor="record-classification">Classification</label><select className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100" id="record-classification" {...register("classification")}><option value="Unclassified">Unclassified</option><option value="Classified">Classified</option></select></div></div>
          <div className="grid gap-2"><label className="text-sm font-semibold text-slate-800" htmlFor="record-document-type">Document type</label><select className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100" id="record-document-type" {...register("documentTypeId", { onChange: () => { setMetadataValues({}); setMetadataErrors({}); } })}><option value="">No configured type</option>{documentTypes.map((documentType) => <option key={documentType.id} value={documentType.id}>{documentType.name}</option>)}</select><p className="text-xs text-slate-500">Selecting a type adds its configured metadata fields.</p></div>
          {selectedDocumentType?.fields.length ? <fieldset className="grid gap-4 rounded-2xl border border-slate-200 p-4"><legend className="px-2 text-sm font-bold text-slate-800">{selectedDocumentType.name} metadata</legend>{selectedDocumentType.fields.map((field) => <div className="grid gap-2" key={field.id}><label className="text-sm font-semibold text-slate-800" htmlFor={`metadata-${field.id}`}>{field.label}{field.isRequired ? " *" : ""}</label>{field.kind === "LONG_TEXT" ? <textarea aria-invalid={Boolean(metadataErrors[field.id])} className="min-h-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100 aria-invalid:border-rose-400" id={`metadata-${field.id}`} maxLength={5000} value={metadataValues[field.id] ?? ""} onChange={(event) => setMetadataValues((current) => ({ ...current, [field.id]: event.target.value }))} /> : field.kind === "SINGLE_SELECT" ? <select aria-invalid={Boolean(metadataErrors[field.id])} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100 aria-invalid:border-rose-400" id={`metadata-${field.id}`} value={metadataValues[field.id] ?? ""} onChange={(event) => setMetadataValues((current) => ({ ...current, [field.id]: event.target.value }))}><option value="">Select an option</option>{field.options.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input aria-invalid={Boolean(metadataErrors[field.id])} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100 aria-invalid:border-rose-400" id={`metadata-${field.id}`} maxLength={field.kind === "SHORT_TEXT" ? 300 : undefined} type={field.kind === "DATE" ? "date" : "text"} value={metadataValues[field.id] ?? ""} onChange={(event) => setMetadataValues((current) => ({ ...current, [field.id]: event.target.value }))} />}{field.helpText ? <p className="text-xs text-slate-500">{field.helpText}</p> : null}{metadataErrors[field.id] ? <p className="text-xs font-medium text-rose-600" role="alert">{metadataErrors[field.id]}</p> : null}</div>)}</fieldset> : null}
          <div className="grid gap-2"><span className="text-sm font-semibold text-slate-800">Primary document file</span><div {...getRootProps()} className={cn("grid min-h-28 cursor-pointer place-items-center rounded-2xl border border-dashed p-4 text-center transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-violet-700", isDragActive ? "border-violet-400 bg-violet-50" : "border-slate-300 bg-slate-50 hover:border-violet-300 hover:bg-violet-50/50")}><input {...getInputProps()} /><div className="grid justify-items-center gap-1.5"><span className="grid size-9 place-items-center rounded-xl bg-white text-violet-700 shadow-sm"><FileUp aria-hidden="true" size={18} /></span><p className="text-sm font-semibold text-slate-700">{isDragActive ? "Drop the file here" : "Drop a file here or choose one"}</p><p className="text-xs text-slate-500">PDF, Office, TXT, CSV, PNG, or JPEG · up to 100 MB</p></div></div>{selectedFile ? <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800"><FolderOpen aria-hidden="true" size={15} /><span className="truncate font-semibold">{selectedFile.name}</span><span className="ml-auto shrink-0">{displaySize(selectedFile.size)}</span></div> : null}{fileError ? <p className="text-xs font-medium text-rose-600" role="alert">{fileError}</p> : null}</div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4"><Button className="rounded-xl" onClick={closeDialog} type="button" variant="secondary">Cancel</Button><Button className="rounded-xl" disabled={isSubmitting} type="submit" variant="default">Create record</Button></div>
        </form>
      </section>
    </div>
  );
}
