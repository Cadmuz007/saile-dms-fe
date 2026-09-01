import { Archive, RotateCcw, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import type { WorkspaceView } from "../types";

interface LifecycleViewProps {
  view: Extract<WorkspaceView, "archives" | "trash">;
}

export function LifecycleView({ view }: LifecycleViewProps) {
  const isArchive = view === "archives";
  const Icon = isArchive ? Archive : Trash2;

  return (
    <div className="grid gap-8 p-6 lg:p-8">
      <section className="grid gap-2">
        <div className="flex items-center gap-2">
          <Icon aria-hidden="true" className="text-fuchsia-700" size={23} />
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">{isArchive ? "Archives" : "Trash bin"}</h1>
        </div>
        <p className="max-w-2xl leading-7 text-slate-600">
          {isArchive
            ? "Archived records can be restored to their original section when the user has permission."
            : "Trash behavior is visible in the wireframes and remains a pending product decision until retention and purge rules are approved."}
        </p>
      </section>

      <Card className="grid max-w-2xl gap-4 border-dashed">
        <Badge className="w-fit" tone={isArchive ? "purple" : "amber"}>{isArchive ? "Archive" : "Trash bin"}</Badge>
        <h2 className="text-xl font-bold text-slate-950">{isArchive ? "No archived records" : "No records in the trash bin"}</h2>
        <p className="leading-7 text-slate-600">
          {isArchive
            ? "Records in the archive will appear here."
            : "Records in this area will appear here."}
        </p>
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700"><RotateCcw aria-hidden="true" size={16} />Actions become available when records are selected.</span>
      </Card>
    </div>
  );
}
