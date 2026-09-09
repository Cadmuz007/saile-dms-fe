"use client";

import { Archive, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface LifecycleTarget {
  id: string;
  kind: "folder" | "document";
  name: string;
  action: "archive" | "restore";
}

interface Props {
  onClose: () => void;
  onConfirm: (target: LifecycleTarget) => Promise<void>;
  target: LifecycleTarget | null;
}

export function LifecycleActionDialog({ onClose, onConfirm, target }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  if (!target) return null;
  const restoring = target.action === "restore";
  const Icon = restoring ? RotateCcw : Archive;

  async function confirm(): Promise<void> {
    setRequestError(null);
    setIsSubmitting(true);
    try { await onConfirm(target!); onClose(); }
    catch (error) { setRequestError(error instanceof Error ? error.message : "The lifecycle action failed."); }
    finally { setIsSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm" role="presentation">
      <section aria-labelledby="lifecycle-title" aria-modal="true" className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl" role="dialog">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div><p className="text-xs font-bold tracking-[0.12em] text-fuchsia-700 uppercase">Lifecycle</p><h2 className="mt-1 text-xl font-bold text-slate-950" id="lifecycle-title">{restoring ? "Restore" : "Archive"} {target.kind}?</h2></div>
          <button aria-label="Close lifecycle dialog" className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700" onClick={onClose} type="button"><X aria-hidden="true" size={18} /></button>
        </div>
        <div className="grid gap-5 p-5">
          <div className="flex gap-3 rounded-xl bg-slate-50 p-4"><Icon aria-hidden="true" className={restoring ? "text-emerald-700" : "text-amber-700"} size={20} /><p className="text-sm leading-6 text-slate-700">{restoring ? `“${target.name}” will return to its original location. Its original parent must already be active.` : target.kind === "folder" ? `“${target.name}” and its currently active descendants will leave the workspace. Existing archived descendants remain independently archived.` : `“${target.name}” will leave the workspace, but every version, attachment, grant, and audit event will be retained.`}</p></div>
          {requestError ? <p className="text-sm font-medium text-rose-600" role="alert">{requestError}</p> : null}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><Button onClick={onClose} type="button" variant="secondary">Cancel</Button><Button disabled={isSubmitting} onClick={() => void confirm()} type="button">{isSubmitting ? "Saving…" : restoring ? "Restore" : "Archive"}</Button></div>
        </div>
      </section>
    </div>
  );
}
