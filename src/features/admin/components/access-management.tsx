"use client";

import AdminPanelSettingsOutlined from "@mui/icons-material/AdminPanelSettingsOutlined";
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Skeleton, Stack, Switch, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import type { AuthenticatedUser } from "@/features/auth/types";
import { AuthenticationSettingsRequestError, getAuthenticationSettings, updateAuthenticationSettings } from "@/services/authentication-settings";
import type { AuthenticationSettings } from "../authentication-settings.types";
import { PageHeader } from "./admin-page-primitives";

const message = (error: unknown) => error instanceof Error ? error.message : "The request could not be completed.";

export function AuthenticationPage({ currentUser, onSignOut }: { currentUser: AuthenticatedUser; onSignOut: () => void }) {
  const canRead = currentUser.permissions.includes("admin.authentication.read");
  const canUpdate = currentUser.permissions.includes("admin.authentication.update");
  const [settings, setSettings] = useState<AuthenticationSettings | null>(null);
  const [desired, setDesired] = useState(true);
  const [loading, setLoading] = useState(canRead);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!canRead) return;
    const controller = new AbortController();
    getAuthenticationSettings(controller.signal).then((value) => {
      if (!controller.signal.aborted) { setSettings(value); setDesired(value.isEnabled); }
    }).catch((error) => {
      if (!controller.signal.aborted) { setError(message(error)); if (error instanceof AuthenticationSettingsRequestError && error.status === 401) onSignOut(); }
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [canRead, refresh, onSignOut]);

  async function persist(isEnabled: boolean) {
    setSaving(true); setError(""); setNotice("");
    try {
      const value = await updateAuthenticationSettings(isEnabled);
      setSettings(value); setDesired(value.isEnabled); setConfirmDisable(false);
      setNotice(isEnabled ? "Embedded sign-in enabled." : "Embedded sign-in disabled. Existing sessions remain valid until their normal expiry.");
    } catch (error) {
      setError(message(error));
      if (error instanceof AuthenticationSettingsRequestError && error.status === 401) onSignOut();
    } finally { setSaving(false); }
  }
  async function save() {
    if (!settings || saving || desired === settings.isEnabled) return;
    if (!desired) { setConfirmDisable(true); return; }
    await persist(true);
  }

  return <Stack spacing={3}>
    <PageHeader title="Authentication" description="Manage embedded sign-in for the Bureau of the Treasury deployment."
      action={canUpdate && settings ? { label: saving ? "Saving…" : "Save authentication settings", icon: <AdminPanelSettingsOutlined />, onClick: save, disabled: saving || desired === settings.isEnabled } : undefined} />
    {notice && <Alert severity="success" onClose={() => setNotice("")}>{notice}</Alert>}
    {error && <Alert severity="error" action={canRead ? <Button onClick={() => { setLoading(true); setError(""); setRefresh((value) => value + 1); }}>Retry</Button> : undefined}>{error}</Alert>}
    {!canRead ? <Alert severity="info">You do not have permission to view authentication settings.</Alert> : loading ? <Skeleton variant="rounded" height={180} /> : settings && <>
      <Paper elevation={0} sx={{ border: "2px solid #810a6a", borderRadius: 1, p: 2.5 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}>
          <Box><Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><Typography sx={{ fontSize: 16, fontWeight: 750 }}>Embedded email and password</Typography><Chip size="small" color={settings.isEnabled ? "success" : "default"} label={settings.isEnabled ? "Enabled" : "Disabled"} /></Stack>
            <Typography color="text.secondary" sx={{ fontSize: 13, mt: .75 }}>Accounts created in Users can sign in when embedded authentication is enabled and all account and license checks pass.</Typography></Box>
          <Switch slotProps={{ input: { "aria-label": "Enable embedded sign-in" } }} checked={desired} disabled={!canUpdate || saving} onChange={(event) => setDesired(event.target.checked)} />
        </Stack>
        <Typography color="text.secondary" sx={{ fontSize: 12, mt: 2 }}>Last updated {new Date(settings.updatedAt).toLocaleString()}{settings.updatedByUser ? ` by ${settings.updatedByUser.firstName} ${settings.updatedByUser.lastName}` : ""}.</Typography>
      </Paper>
      <Paper elevation={0} sx={{ borderRadius: 1, p: 2.5 }}><Typography sx={{ fontSize: 16, fontWeight: 750 }}>Active Directory / LDAP</Typography><Typography color="text.secondary" sx={{ fontSize: 13, mt: .75 }}>Connection settings, credential storage, directory testing, and synchronization rules are pending approval and are not available in this milestone.</Typography><Chip label="Deferred" size="small" sx={{ mt: 2 }} /></Paper>
    </>}
    <Dialog open={confirmDisable} onClose={() => { if (!saving) setConfirmDisable(false); }} aria-labelledby="disable-embedded-title">
      <DialogTitle id="disable-embedded-title">Disable embedded sign-in?</DialogTitle><DialogContent><Alert severity="warning">New email/password sign-ins will be blocked for this deployment. Existing authenticated sessions remain valid until their access token expires, so an authorized administrator can re-enable sign-in during that window.</Alert></DialogContent>
      <DialogActions><Button disabled={saving} onClick={() => setConfirmDisable(false)}>Cancel</Button><Button color="warning" variant="contained" disabled={saving} onClick={() => persist(false)}>{saving ? "Disabling…" : "Disable sign-in"}</Button></DialogActions>
    </Dialog>
  </Stack>;
}
