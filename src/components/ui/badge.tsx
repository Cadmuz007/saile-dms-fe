import type { HTMLAttributes } from "react";

import { cn } from "@/utils/cn";

type BadgeTone = "neutral" | "blue" | "amber" | "green" | "red" | "purple";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  blue: "bg-sky-100 text-sky-800",
  amber: "bg-amber-100 text-amber-800",
  green: "bg-emerald-100 text-emerald-800",
  red: "bg-rose-100 text-rose-800",
  purple: "bg-violet-100 text-violet-800",
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn("inline-flex min-h-6 items-center rounded-sm px-2.5 text-xs font-semibold", toneClasses[tone], className)}
      {...props}
    />
  );
}
