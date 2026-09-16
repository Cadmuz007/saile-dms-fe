"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import type { AuthenticatedUser } from "@/features/auth/types";
import { getAccountPolicySettings, saveAccountPolicySettings, AccountPolicyRequestError, type AccountPolicySettings } from "@/services/account-policy";

export function AccountPolicyPanel({ currentUser, onSignOut }: { currentUser: AuthenticatedUser; onSignOut: () => void }) {
  const [settings, setSettings] = useState<AccountPolicySettings | null>(null);
  const [minutes, setMinutes] = useState("15");
  const [idleMinutes, setIdleMinutes] = useState("30");
  const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0); const [busy, setBusy] = useState(false);
  const canView = currentUser.permissions.includes("admin.policies.view");
  const canManage = currentUser.permissions.includes("admin.policies.manage");
  useEffect(() => {
    if (!canView) return;
    const controller = new AbortController();
    getAccountPolicySettings(controller.signal).then((value) => {
      if (controller.signal.aborted) return;
      setSettings(value); setMinutes(String(value.current.configuration.lockoutMinutes)); setIdleMinutes(String(value.current.configuration.idleMinutes ?? 30)); setError("");
    }).catch((e: unknown) => {
      if (controller.signal.aborted) return;
      setSettings(null); setError(e instanceof Error ? e.message : "Account policy unavailable.");
      if (e instanceof AccountPolicyRequestError && e.status === 401) onSignOut();
    });
    return () => controller.abort();
  }, [canView, refresh, onSignOut]);
  async function save() {
    if (!settings) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const current = await saveAccountPolicySettings(settings.current.revision, { lockoutMinutes: Number(minutes), idleMinutes: Number(idleMinutes) });
      setSettings({ current, history: [current, ...settings.history].slice(0, 20) });
      setMinutes(String(current.configuration.lockoutMinutes)); setNotice(`Account policy saved as revision ${current.revision}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Account policy could not be saved.");
      if (e instanceof AccountPolicyRequestError && e.status === 401) onSignOut();
    } finally { setBusy(false); }
  }
  if (!canView) return null;
  return <Paper component="section" aria-label="Account protection" sx={{ p: 3 }}><Stack spacing={2}>
    <Typography variant="h6">Account protection</Typography>
    <Typography>Three incorrect passwords trigger a temporary lockout. The duration below applies to new lockouts; existing lockouts retain their expiry.</Typography>
    {error ? <Alert severity="error">{error}</Alert> : null}
    {notice ? <Alert severity="success">{notice}</Alert> : null}
    <Button disabled={busy} onClick={() => setRefresh((value) => value + 1)}>Reload account policy</Button>
    {!settings && !error ? <Typography>Loading account policy…</Typography> : null}
    {settings ? <Stack component="form" spacing={2} onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <TextField required type="number" label="Temporary block duration (minutes)" helperText="Whole minutes from 1 to 1440. Default: 15 minutes." value={minutes} disabled={!canManage || busy} slotProps={{ htmlInput: { min: 1, max: 1440, step: 1 } }} onChange={(event) => setMinutes(event.target.value)} />
      <TextField required type="number" label="Logout when inactive (minutes)" helperText="1–480 minutes; default 30. Applies to new sessions. Maximum session lifetime is always 8 hours; polling does not count as activity." value={idleMinutes} disabled={!canManage || busy} slotProps={{ htmlInput: { min: 1, max: 480, step: 1 } }} onChange={(event) => setIdleMinutes(event.target.value)} />
      <Button type="submit" variant="contained" disabled={!canManage || busy}>{busy ? "Saving account policy…" : "Save account policy"}</Button>
    </Stack> : null}
    <Typography variant="subtitle1">Account policy history</Typography>
    {settings?.history.length === 0 ? <Typography>Default duration applies; no revisions saved.</Typography> : null}
    {settings?.history.map((item) => <Typography key={item.id}>Revision {item.revision}: lockout {item.configuration.lockoutMinutes} minutes, idle {item.configuration.idleMinutes ?? 30} minutes — {item.actor?.firstName} {item.actor?.lastName}, {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</Typography>)}
  </Stack></Paper>;
}
