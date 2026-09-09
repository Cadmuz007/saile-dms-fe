import Image from "next/image";
import { FileText } from "lucide-react";

import { cn } from "@/lib/utils";

import type { MockDocument } from "../types";

const iconSources: Partial<Record<MockDocument["extension"], string>> = {
  PDF: "/Icons/pdf-icon.png",
  DOCX: "/Icons/word-icon.png",
  XLSX: "/Icons/excel-icon.png",
  PPTX: "/Icons/powerpoint-icon.png",
};

const fallbackClasses: Record<MockDocument["extension"], string> = {
  PDF: "bg-rose-50 text-rose-700 ring-rose-100",
  DOCX: "bg-sky-50 text-sky-700 ring-sky-100",
  XLSX: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  PPTX: "bg-amber-50 text-amber-700 ring-amber-100",
  PNG: "bg-violet-50 text-violet-700 ring-violet-100",
  TXT: "bg-slate-50 text-slate-700 ring-slate-100",
  CSV: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  JPEG: "bg-violet-50 text-violet-700 ring-violet-100",
};

type IconSize = "small" | "medium" | "large" | "hero";

const sizeClasses: Record<IconSize, string> = {
  small: "size-9",
  medium: "size-10",
  large: "size-11",
  hero: "size-14",
};

interface DocumentTypeIconProps {
  extension: MockDocument["extension"];
  size?: IconSize;
}

export function DocumentTypeIcon({ extension, size = "medium" }: DocumentTypeIconProps) {
  const source = iconSources[extension];

  if (source) {
    return <Image alt="" aria-hidden="true" className={cn("shrink-0 object-contain", sizeClasses[size])} height={56} src={source} width={56} />;
  }

  return (
    <span className={cn("grid shrink-0 place-items-center rounded-lg ring-1", sizeClasses[size], fallbackClasses[extension])}>
      <FileText aria-hidden="true" size={size === "hero" ? 27 : size === "large" ? 22 : size === "medium" ? 19 : 18} />
    </span>
  );
}
