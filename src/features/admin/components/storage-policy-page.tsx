"use client";
import { useEffect, useState } from "react";
import { Alert, Button, FormControlLabel, Paper, Stack, Switch, TextField, Typography } from "@mui/material";
import { getStoragePolicySettings, saveStoragePolicySettings, StoragePolicyRequestError, type StoragePolicySettings, type StorageConfiguration } from "@/services/storage-policy";
import type { AuthenticatedUser } from "@/features/auth/types";
import { AccountPolicyPanel } from "./account-policy-panel";
import { FileTypePolicyPanel } from "./file-type-policy-panel";

export function StoragePolicyPage({ currentUser, onSignOut }: { currentUser: AuthenticatedUser; onSignOut: () => void }) {
  const [settings, setSettings] = useState<StoragePolicySettings | null>(null);
  const [draft, setDraft] = useState<StorageConfiguration | null>(null);
  const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0); const [busy, setBusy] = useState(false);
  const canView = currentUser.permissions.includes("admin.policies.view");
  const canManage = currentUser.permissions.includes("admin.policies.manage");
  useEffect(() => {
    if (!canView) return;
    const controller = new AbortController();
    getStoragePolicySettings(controller.signal).then((value) => { if (!controller.signal.aborted) { setSettings(value); setDraft(value.current.configuration); setError(""); } }).catch((e: unknown) => {
      if (controller.signal.aborted) return;
      setError(e instanceof Error ? e.message : "Policy unavailable."); setSettings(null); setDraft(null);
      if (e instanceof StoragePolicyRequestError && e.status === 401) onSignOut();
    });
    return () => controller.abort();
  }, [canView, refresh, onSignOut]);
  async function save() {
    if (!settings || !draft) return;
    setBusy(true); setError(""); setNotice("");
    try { const current = await saveStoragePolicySettings(settings.current.revision, draft); setSettings({ current, history: [current, ...settings.history].slice(0, 20) }); setDraft(current.configuration); setNotice(`Saved revision ${current.revision}.`); }
    catch (e) { setError(e instanceof Error ? e.message : "Save failed."); if (e instanceof StoragePolicyRequestError && e.status === 401) onSignOut(); }
    finally { setBusy(false); }
  }
  return <Stack spacing={2}>
    <Typography variant="h5">Policies</Typography>
    <Alert severity="info">Storage, password lockout, inactivity sessions and user-upload file-type controls are enforced. SLA reminders are configured under SLA.</Alert>
    <AccountPolicyPanel currentUser={currentUser} onSignOut={onSignOut} />
    <FileTypePolicyPanel currentUser={currentUser} onSignOut={onSignOut} />
    {!canView ? <Alert severity="warning">admin.policies.view permission is required.</Alert> : <>
      {error ? <Alert severity="error">{error}</Alert> : null}{notice ? <Alert severity="success">{notice}</Alert> : null}
      <Button disabled={busy} onClick={() => setRefresh((v) => v + 1)}>Reload policy</Button>
      {!settings && !error ? <Typography>Loading policy…</Typography> : null}
      {draft && settings ? <Paper component="form" sx={{ p: 3 }} onSubmit={(event) => { event.preventDefault(); void save(); }}><Stack spacing={2}>
        <Typography variant="h6">Owner storage quota</Typography>
        <Typography>All retained primary and attachment versions count, including archived files. Editor uploads and workflow output charge the document owner. Lowering the limit never deletes content.</Typography>
        <TextField required type="number" label="Storage per owner (GB)" helperText="1 GB = 1,000,000,000 bytes. Whole numbers from 1 to 100000." value={draft.quotaGb} disabled={!canManage || busy} onChange={(e) => setDraft({ ...draft, quotaGb: Number(e.target.value) })} />
        <FormControlLabel label="Block new retained bytes exceeding the limit" control={<Switch checked={draft.blockOverQuota} disabled={!canManage || busy} onChange={(_, checked) => setDraft({ ...draft, blockOverQuota: checked })} />} />
        {!draft.blockOverQuota ? <Alert severity="warning">Blocking is disabled. Uploads may exceed the configured quota; usage continues to be counted.</Alert> : null}
        <Button type="submit" disabled={!canManage || busy} variant="contained">{busy ? "Saving…" : "Save storage policy"}</Button>
      </Stack></Paper> : null}
      <Typography variant="h6">Recent revisions</Typography>
      {settings?.history.length === 0 ? <Typography>Defaults apply; no changes have been saved.</Typography> : null}
      {settings?.history.map((item) => <Typography key={item.id}>Revision {item.revision}: {item.configuration.quotaGb} GB, blocking {item.configuration.blockOverQuota ? "on" : "off"} — {item.actor?.firstName} {item.actor?.lastName}, {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</Typography>)}
    </>}
  </Stack>;
}
