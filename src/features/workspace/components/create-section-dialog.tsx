"use client";

import { FolderPlus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";

import type { LibrarySection } from "../types";

const sectionSchema = z.object({
  name: z.string().trim().min(3, "Enter at least 3 characters.").max(60, "Use 60 characters or fewer."),
  section: z.enum(["Home", "Private", "Public"]),
});

type SectionFormValues = z.infer<typeof sectionSchema>;

interface CreateSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (section: { name: string; section: LibrarySection }) => void;
}

export function CreateSectionDialog({ open, onOpenChange, onCreate }: CreateSectionDialogProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: { name: "", section: "Home" },
  });

  function closeDialog(): void {
    reset();
    onOpenChange(false);
  }

  function submit(values: SectionFormValues): void {
    onCreate({ name: values.name, section: values.section });
    closeDialog();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm" role="presentation">
      <section aria-describedby="create-section-description" aria-labelledby="create-section-title" aria-modal="true" className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl" role="dialog">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6"><div><p className="text-xs font-bold tracking-[0.12em] text-violet-700 uppercase">Sections</p><h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950" id="create-section-title">Create section</h2><p className="mt-1 text-sm text-slate-500" id="create-section-description">Create a section in the selected document area.</p></div><button aria-label="Close create section dialog" className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700" onClick={closeDialog} type="button"><X aria-hidden="true" size={19} /></button></div>
        <form className="grid gap-5 p-5 sm:p-6" onSubmit={handleSubmit(submit)}><div className="grid gap-2"><label className="text-sm font-semibold text-slate-800" htmlFor="section-name">Section name</label><input aria-invalid={Boolean(errors.name)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 aria-invalid:border-rose-400" id="section-name" placeholder="e.g. Treasury Circulars" {...register("name")} />{errors.name ? <p className="text-xs font-medium text-rose-600" role="alert">{errors.name.message}</p> : null}</div><div className="grid gap-2"><label className="text-sm font-semibold text-slate-800" htmlFor="section-location">Document area</label><select className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100" id="section-location" {...register("section")}><option value="Home">Home</option><option value="Private">Private</option><option value="Public">Public</option></select></div><div className="flex items-center gap-2 rounded-2xl bg-violet-50 p-3 text-xs leading-5 text-violet-800"><FolderPlus aria-hidden="true" className="shrink-0" size={17} />Organize related records in one place.</div><div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4"><Button className="rounded-xl" onClick={closeDialog} type="button" variant="secondary">Cancel</Button><Button className="rounded-xl" disabled={isSubmitting} type="submit" variant="default">Create section</Button></div></form>
      </section>
    </div>
  );
}
