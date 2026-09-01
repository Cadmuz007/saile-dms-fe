import type { HTMLAttributes } from "react";

import { cn } from "@/utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <article
      className={cn("rounded-xl border border-slate-200 bg-white p-5 shadow-sm", className)}
      {...props}
    />
  );
}
