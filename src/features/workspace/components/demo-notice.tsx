import { CheckCircle2, X } from "lucide-react";

interface DemoNoticeProps {
  message: string | null;
  onDismiss: () => void;
}

export function DemoNotice({ message, onDismiss }: DemoNoticeProps) {
  if (!message) return null;

  return (
    <div aria-live="polite" className="fixed right-4 bottom-4 z-[60] flex max-w-sm items-start gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-xl shadow-slate-900/10">
      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><CheckCircle2 aria-hidden="true" size={17} /></span>
      <p className="flex-1 pt-1 text-sm leading-5 text-slate-700">{message}</p>
      <button aria-label="Dismiss notification" className="grid size-7 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700" onClick={onDismiss} type="button"><X aria-hidden="true" size={16} /></button>
    </div>
  );
}
