"use client";
import { useEffect, useState } from "react";
import { getStorageUsage, type StorageUsage } from "@/services/documents";
import { subscribeToWorkspaceChanges } from "@/services/workspace-realtime";
export function StorageUsageIndicator() {
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  useEffect(() => {
    let active = true;
    const refresh = () => { void getStorageUsage().then((value) => { if (active) setUsage(value); }).catch(() => { if (active) setUsage(null); }); };
    refresh(); const timer = window.setInterval(refresh, 60_000); const unsubscribe = subscribeToWorkspaceChanges(refresh, () => { setUsage(null); refresh(); });
    return () => { active = false; window.clearInterval(timer); unsubscribe(); };
  }, []);
  if (!usage) return <span className="text-xs text-slate-500">Storage unavailable</span>;
  const used = Number(usage.usedBytes), limit = Number(usage.limitBytes);
  return <div title="Includes all retained versions, attachments and archived files owned by you."><p className="text-[11px] text-slate-700">{(used / 1e9).toFixed(2)} GB of {limit / 1e9} GB</p><progress aria-label="Owner storage used" className="h-1 w-24" max={limit} value={Math.min(used, limit)} />{usage.uploadsBlocked ? <p className="text-xs text-rose-700">Storage full</p> : null}</div>;
}
