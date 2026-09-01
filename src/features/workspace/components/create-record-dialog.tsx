"use client";

import { FileUp, FolderOpen, X } from "lucide-react";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { LibrarySection, MockDocument } from "../types";

const recordSchema = z.object({
  title: z.string().trim().min(3, "Enter at least 3 characters.").max(120, "Use 120 characters or fewer."),
  section: z.enum(["Home", "Private", "Public"]),
  classification: z.enum(["Unclassified", "Classified"]),
});

type RecordFormValues = z.infer<typeof recordSchema>;

interface CreateRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (record: Pick<MockDocument, "title" | "section" | "classification" | "extension" | "size">) => void;
}

const acceptedFiles = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "image/png": [".png"],
};

function displaySize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getExtension(fileName: string): MockDocument["extension"] {
  const extension = fileName.split(".").pop()?.toUpperCase();
  return extension === "DOCX" || extension === "XLSX" || extension === "PPTX" || extension === "PNG" ? extension : "PDF";
}

export function CreateRecordDialog({ open, onOpenChange, onCreate }: CreateRecordDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<RecordFormValues>({
    resolver: zodResolver(recordSchema),
    defaultValues: { title: "", section: "Home", classification: "Unclassified" },
  });
  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    accept: acceptedFiles,
    maxFiles: 1,
    maxSize: 25 * 1024 * 1024,
    multiple: false,
    onDropAccepted: ([file]) => { setSelectedFile(file); setFileError(null); },
    onDropRejected: ([rejection]) => { setSelectedFile(null); setFileError(rejection?.errors[0]?.message ?? "Choose one supported file under 25 MB."); },
  });

  function closeDialog(): void {
    reset();
    setSelectedFile(null);
    setFileError(null);
    onOpenChange(false);
  }

  function submit(values: RecordFormValues): void {
    onCreate({
      title: values.title,
      section: values.section as LibrarySection,
      classification: values.classification,
      extension: selectedFile ? getExtension(selectedFile.name) : "PDF",
      size: selectedFile ? displaySize(selectedFile.size) : "0 KB",
    });
    closeDialog();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm" role="presentation">
      <section aria-describedby="create-record-description" aria-labelledby="create-record-title" aria-modal="true" className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl" role="dialog">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6"><div><p className="text-xs font-bold tracking-[0.12em] text-violet-700 uppercase">Records</p><h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950" id="create-record-title">Create record</h2><p className="mt-1 text-sm text-slate-500" id="create-record-description">Add document information to your workspace.</p></div><button aria-label="Close create record dialog" className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700" onClick={closeDialog} type="button"><X aria-hidden="true" size={19} /></button></div>
        <form className="grid gap-5 p-5 sm:p-6" onSubmit={handleSubmit(submit)}>
          <div className="grid gap-2"><label className="text-sm font-semibold text-slate-800" htmlFor="record-title">Record title</label><input aria-invalid={Boolean(errors.title)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 aria-invalid:border-rose-400" id="record-title" placeholder="e.g. Financial Performance Report Q3" {...register("title")} />{errors.title ? <p className="text-xs font-medium text-rose-600" role="alert">{errors.title.message}</p> : null}</div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><label className="text-sm font-semibold text-slate-800" htmlFor="record-section">Section</label><select className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100" id="record-section" {...register("section")}><option value="Home">Home</option><option value="Private">Private</option><option value="Public">Public</option></select></div><div className="grid gap-2"><label className="text-sm font-semibold text-slate-800" htmlFor="record-classification">Classification</label><select className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100" id="record-classification" {...register("classification")}><option value="Unclassified">Unclassified</option><option value="Classified">Classified</option></select></div></div>
          <div className="grid gap-2"><span className="text-sm font-semibold text-slate-800">File selection <span className="font-normal text-slate-400">(optional)</span></span><div {...getRootProps()} className={cn("grid min-h-28 cursor-pointer place-items-center rounded-2xl border border-dashed p-4 text-center transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-violet-700", isDragActive ? "border-violet-400 bg-violet-50" : "border-slate-300 bg-slate-50 hover:border-violet-300 hover:bg-violet-50/50")}><input {...getInputProps()} /><div className="grid justify-items-center gap-1.5"><span className="grid size-9 place-items-center rounded-xl bg-white text-violet-700 shadow-sm"><FileUp aria-hidden="true" size={18} /></span><p className="text-sm font-semibold text-slate-700">{isDragActive ? "Drop the file here" : "Drop a file here or choose one"}</p><p className="text-xs text-slate-500">PDF, DOCX, XLSX, PPTX, or PNG · up to 25 MB</p></div></div>{selectedFile ? <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800"><FolderOpen aria-hidden="true" size={15} /><span className="truncate font-semibold">{selectedFile.name}</span><span className="ml-auto shrink-0">{displaySize(selectedFile.size)}</span></div> : null}{fileError ? <p className="text-xs font-medium text-rose-600" role="alert">{fileError}</p> : null}</div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4"><Button className="rounded-xl" onClick={closeDialog} type="button" variant="secondary">Cancel</Button><Button className="rounded-xl" disabled={isSubmitting} type="submit" variant="default">Create record</Button></div>
        </form>
      </section>
    </div>
  );
}
