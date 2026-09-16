"use client";
import { useEffect, useState } from "react";
import { Alert, Button, Checkbox, FormControlLabel, FormGroup, Paper, Stack, Typography } from "@mui/material";
import type { AuthenticatedUser } from "@/features/auth/types";
import { getFileTypePolicySettings, saveFileTypePolicySettings, FileTypePolicyRequestError, uploadFileTypes, type FileTypeConfiguration, type FileTypePolicySettings } from "@/services/file-type-policy";

export function FileTypePolicyPanel({ currentUser, onSignOut }: { currentUser: AuthenticatedUser; onSignOut: () => void }) {
  const [settings, setSettings] = useState<FileTypePolicySettings | null>(null);
  const [draft, setDraft] = useState<FileTypeConfiguration>({ allowedTypes: [] });
  const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0); const [busy, setBusy] = useState(false);
  const canView = currentUser.permissions.includes("admin.policies.view");
  const canManage = currentUser.permissions.includes("admin.policies.manage");
  useEffect(() => {
    if (!canView) return;
    const controller = new AbortController();
    getFileTypePolicySettings(controller.signal).then((value) => {
      if (controller.signal.aborted) return;
      setSettings(value); setDraft(value.current.configuration); setError("");
    }).catch((e: unknown) => {
      if (controller.signal.aborted) return;
      setSettings(null); setError(e instanceof Error ? e.message : "File-type policy unavailable.");
      if (e instanceof FileTypePolicyRequestError && e.status === 401) onSignOut();
    });
    return () => controller.abort();
  }, [canView, refresh, onSignOut]);
  async function save() {
    if (!settings) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const current = await saveFileTypePolicySettings(settings.current.revision, draft);
      setSettings({ current, history: [current, ...settings.history].slice(0, 20) }); setDraft(current.configuration);
      setNotice(`File-type policy saved as revision ${current.revision}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "File-type policy could not be saved.");
      if (e instanceof FileTypePolicyRequestError && e.status === 401) onSignOut();
    } finally { setBusy(false); }
  }
  if (!canView) return null;
  return <Paper component="section" aria-label="Allowed upload file types" sx={{ p: 3 }}><Stack spacing={2}>
    <Typography variant="h6">Allowed upload file types</Typography>
    <Typography>Applies only to user-uploaded documents, replacement versions and attachments. Existing files remain accessible. Workflow conversions and generated copies are exempt. Content validation, malware scanning and storage limits still apply.</Typography>
    {error ? <Alert severity="error">{error}</Alert> : null}
    {notice ? <Alert severity="success">{notice}</Alert> : null}
    <Button disabled={busy} onClick={() => setRefresh((value) => value + 1)}>Reload file-type policy</Button>
    {!settings && !error ? <Typography>Loading file-type policy...</Typography> : null}
    {settings ? <Stack component="form" spacing={2} onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <FormGroup aria-label="Allowed formats">{uploadFileTypes.map((type) => <FormControlLabel key={type} label={type === "JPEG" ? "JPEG (.jpg and .jpeg)" : type} control={<Checkbox checked={draft.allowedTypes.includes(type)} disabled={!canManage || busy} onChange={(_, checked) => setDraft({ allowedTypes: checked ? [...draft.allowedTypes, type] : draft.allowedTypes.filter((item) => item !== type) })} />} />)}</FormGroup>
      {!draft.allowedTypes.length ? <Alert severity="warning">No formats selected: saving will block all new user uploads, including replacement versions and attachments.</Alert> : null}
      <Button type="submit" variant="contained" disabled={!canManage || busy}>{busy ? "Saving file-type policy..." : "Save file-type policy"}</Button>
    </Stack> : null}
    <Typography variant="subtitle1">File-type policy history</Typography>
    {settings?.history.length === 0 ? <Typography>All supported formats are allowed by default; no revisions saved.</Typography> : null}
    {settings?.history.map((item) => <Typography key={item.id}>Revision {item.revision}: {item.configuration.allowedTypes.join(", ") || "All user uploads blocked"} — {item.actor?.firstName} {item.actor?.lastName}, {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</Typography>)}
  </Stack></Paper>;
}
