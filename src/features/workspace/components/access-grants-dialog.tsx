"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Trash2, UsersRound, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getResourceAccess, grantResourceAccess, revokeResourceAccess } from "@/services/documents";
import type { AccessResourceKind, ApiAccessLevel, ApiAccessOverview, ApiAccessTargetType } from "@/services/documents";

interface AccessResource { id: string; kind: AccessResourceKind; name: string; }
interface AccessGrantsDialogProps { resource: AccessResource | null; onClose: () => void; onChanged: () => Promise<void>; }

export function AccessGrantsDialog({ resource, onClose, onChanged }: AccessGrantsDialogProps) {
  const [overview, setOverview] = useState<ApiAccessOverview | null>(null);
  const [target, setTarget] = useState("");
  const [accessLevel, setAccessLevel] = useState<ApiAccessLevel>("READ");
  const [pendingRevokeId, setPendingRevokeId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(current: AccessResource): Promise<void> {
    setError(null);
    try { setOverview(await getResourceAccess(current.kind, current.id)); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Access settings could not be loaded."); }
  }

  useEffect(() => {
    if (!resource) return;
    const timer = window.setTimeout(() => { void load(resource); }, 0);
    return () => window.clearTimeout(timer);
  }, [resource]);

  const activeTargets = useMemo(() => new Set(overview?.grants.map((grant) => grant.user ? `USER:${grant.user.id}` : `GROUP:${grant.group?.id}`) ?? []), [overview]);

  async function grant(): Promise<void> {
    if (!resource || !target) return;
    const [targetType, targetId] = target.split(":") as [ApiAccessTargetType, string];
    setBusy(true); setError(null);
    try { await grantResourceAccess(resource.kind, resource.id, { targetType, targetId, accessLevel }); await Promise.all([load(resource), onChanged()]); setTarget(""); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Access could not be granted."); }
    finally { setBusy(false); }
  }

  async function revoke(grantId: string): Promise<void> {
    if (!resource) return;
    setBusy(true); setError(null);
    try { await revokeResourceAccess(resource.kind, resource.id, grantId); setPendingRevokeId(null); await Promise.all([load(resource), onChanged()]); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Access could not be revoked."); }
    finally { setBusy(false); }
  }

  if (!resource) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm" role="presentation">
      <section aria-describedby="access-dialog-description" aria-labelledby="access-dialog-title" aria-modal="true" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl" role="dialog">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6"><div><p className="text-xs font-bold tracking-[0.12em] text-violet-700 uppercase">Private access</p><h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950" id="access-dialog-title">Manage access to {resource.name}</h2><p className="mt-1 text-sm text-slate-500" id="access-dialog-description">Grant read or edit access to active users and groups. Revoked grants remain in the audit history.</p></div><button aria-label="Close access dialog" className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700" onClick={onClose} type="button"><X aria-hidden="true" size={19} /></button></div>

        <div className="grid gap-6 p-5 sm:p-6">
          <section className="grid gap-3" aria-labelledby="grant-access-heading"><div><h3 className="font-bold text-slate-900" id="grant-access-heading">Grant access</h3><p className="mt-1 text-xs text-slate-500">Edit grants resource access, not application permissions. Version upload and PDF approval also require documents.version. Document Type visibility still applies.</p></div><div className="grid gap-3 sm:grid-cols-[1fr_9rem_auto]"><label className="grid gap-1.5 text-xs font-semibold text-slate-700">User or group<select className="h-10 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100" disabled={!overview || busy} onChange={(event) => setTarget(event.target.value)} value={target}><option value="">Select a recipient</option><optgroup label="Users">{overview?.candidates.users.filter((user) => !activeTargets.has(`USER:${user.id}`)).map((user) => <option key={user.id} value={`USER:${user.id}`}>{user.firstName} {user.lastName} — {user.email}</option>)}</optgroup><optgroup label="Groups">{overview?.candidates.groups.filter((group) => !activeTargets.has(`GROUP:${group.id}`)).map((group) => <option key={group.id} value={`GROUP:${group.id}`}>{group.name} ({group._count.memberships})</option>)}</optgroup></select></label><label className="grid gap-1.5 text-xs font-semibold text-slate-700">Access level<select className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100" disabled={busy} onChange={(event) => setAccessLevel(event.target.value as ApiAccessLevel)} value={accessLevel}><option value="READ">Read</option><option value="EDIT">Edit</option></select></label><Button className="self-end rounded-xl" disabled={!target || busy} onClick={() => void grant()} type="button"><ShieldCheck aria-hidden="true" size={16} />Grant</Button></div></section>

          <section className="grid gap-3" aria-labelledby="active-access-heading">
            <div className="flex items-center gap-2"><UsersRound aria-hidden="true" className="text-violet-700" size={18} /><h3 className="font-bold text-slate-900" id="active-access-heading">Active grants</h3></div>
            {!overview && !error ? <p className="text-sm text-slate-500">Loading access settings…</p> : null}
            {overview?.grants.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">No direct grants on this {resource.kind === "documents" ? "document" : "folder"}. Inherited folder access{resource.kind === "documents" ? ", transform assignments and pending workflow access" : ""} may still apply.</p> : null}
            <div className="grid gap-2">{overview?.grants.map((grant) => {
              const label = grant.user ? `${grant.user.firstName} ${grant.user.lastName}` : grant.group?.name ?? "Group";
              const detail = grant.user?.email ?? `${grant.group?._count.memberships ?? 0} active members`;
              const confirming = pendingRevokeId === grant.id;
              return <article className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3" key={grant.id}><div><p className="text-sm font-semibold text-slate-900">{label}</p><p className="mt-0.5 text-xs text-slate-500">{detail} · {grant.accessLevel === "EDIT" ? "Can edit" : "Can read"}</p>{confirming ? <p className="mt-1 text-xs font-medium text-rose-700">This direct grant will be revoked. Other group, inherited or workflow access may still apply. Historical grant records will be retained.</p> : null}</div><div className="flex gap-2">{confirming ? <><Button disabled={busy} onClick={() => setPendingRevokeId(null)} size="sm" type="button" variant="secondary">Cancel</Button><Button aria-label={`Confirm revoke access for ${label}`} disabled={busy} onClick={() => void revoke(grant.id)} size="sm" type="button" variant="destructive"><Trash2 aria-hidden="true" size={14} />Confirm revoke</Button></> : <Button aria-label={`Revoke access for ${label}`} className="text-rose-700 hover:text-rose-800" disabled={busy} onClick={() => setPendingRevokeId(grant.id)} size="sm" type="button" variant="secondary"><Trash2 aria-hidden="true" size={14} />Revoke</Button>}</div></article>;
            })}</div>
          </section>

          {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700" role="alert">{error}</p> : null}
          <div className="flex justify-end border-t border-slate-100 pt-4"><Button className="rounded-xl" onClick={onClose} type="button" variant="secondary">Done</Button></div>
        </div>
      </section>
    </div>
  );
}
