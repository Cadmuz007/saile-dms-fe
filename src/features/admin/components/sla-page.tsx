"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Button, Checkbox, FormControlLabel, FormGroup, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import type { AuthenticatedUser } from "@/features/auth/types";
import { getSlaSettings, saveSlaSettings, SlaRequestError, type SlaConfiguration, type SlaSettings } from "@/services/sla";
import { PageHeader } from "./admin-page-primitives";

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function SlaPage({ currentUser, onSignOut }: { currentUser: AuthenticatedUser; onSignOut: () => void }) {
  const [settings, setSettings] = useState<SlaSettings | null>(null);
  const [draft, setDraft] = useState<SlaConfiguration | null>(null);
  const [holidays, setHolidays] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const canView = currentUser.permissions.includes("admin.sla.view");
  const canManage = currentUser.permissions.includes("admin.sla.manage");

  useEffect(() => {
    if (!canView) return;
    const controller = new AbortController();
    getSlaSettings(controller.signal).then((value) => {
      if (controller.signal.aborted) return;
      setSettings(value); setDraft(value.current.configuration); setHolidays(value.current.configuration.calendar.holidays.join("\n")); setError(null);
    }).catch((requestError) => {
      if (controller.signal.aborted) return;
      setSettings(null); setDraft(null);
      if (requestError instanceof SlaRequestError && requestError.status === 401) onSignOut();
      setError(requestError instanceof Error ? requestError.message : "Could not load SLA settings.");
    });
    return () => controller.abort();
  }, [canView, refresh, onSignOut]);

  async function save() {
    if (!settings || !draft) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      const current = await saveSlaSettings(settings.current.revision, { ...draft, calendar: { ...draft.calendar, holidays: holidays.split(/\r?\n/).map((value) => value.trim()).filter(Boolean) } });
      setSettings({ current, history: [current, ...settings.history].slice(0, 20) });
      setDraft(current.configuration); setNotice(`SLA settings saved as revision ${current.revision}.`);
    } catch (requestError) {
      if (requestError instanceof SlaRequestError && requestError.status === 401) onSignOut();
      setError(requestError instanceof Error ? requestError.message : "Could not save SLA settings.");
    } finally { setBusy(false); }
  }

  return <Stack spacing={3}>
    <PageHeader title="Service level agreement" description="Configure response limits and the working calendar used to measure them." />
    {!canView ? <Alert severity="warning">SLA view permission is required.</Alert> : <>
      {error ? <Alert severity="error" action={<Button disabled={busy} onClick={() => setRefresh((value) => value + 1)}>Reload</Button>}>{error}</Alert> : null}
      {notice ? <Alert severity="success" onClose={() => setNotice(null)}>{notice}</Alert> : null}
      {!settings && !error ? <Typography>Loading SLA settings…</Typography> : null}
      {settings && draft ? <Box component="form" onSubmit={(event) => { event.preventDefault(); void save(); }}>
        <Stack spacing={3}>
          <Alert severity="info">Settings apply when workflow tasks activate. Existing deadlines keep their original policy; pre-rollout tasks remain untracked. Setback and notification delivery are not active yet.</Alert>
          <Paper sx={{ p: 2.5 }} elevation={0}><Stack spacing={2}>
            <Typography variant="h6">Response limits</Typography>
            <Typography variant="body2" color="text.secondary">An explicit For Review response starts the review allowance. Opening a document does not count as a response.</Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField required fullWidth disabled={!canManage || busy} label="Initial response (business hours)" type="number" value={draft.responseHours} slotProps={{ htmlInput: { min: 1, max: 8760, step: 1 } }} onChange={(event) => setDraft({ ...draft, responseHours: Number(event.target.value) })} />
              <TextField required fullWidth disabled={!canManage || busy} label="For Review (business hours)" type="number" value={draft.reviewHours} slotProps={{ htmlInput: { min: 1, max: 8760, step: 1 } }} onChange={(event) => setDraft({ ...draft, reviewHours: Number(event.target.value) })} />
              <TextField select fullWidth disabled={!canManage || busy} label="Reminder interval (hours)" value={draft.reminderHours} helperText="Notification delivery follows in Milestone 6." onChange={(event) => setDraft({ ...draft, reminderHours: Number(event.target.value) as 4 | 8 | 12 })}>{[4, 8, 12].map((hours) => <MenuItem key={hours} value={hours}>{hours} hours</MenuItem>)}</TextField>
            </Stack>
          </Stack></Paper>
          <Paper sx={{ p: 2.5 }} elevation={0}><Stack spacing={2}>
            <Typography variant="h6">Business Calendar</Typography>
            <TextField label="Time zone" value="Asia/Manila (UTC+08:00)" slotProps={{ input: { readOnly: true } }} />
            <Box><Typography variant="subtitle2">Working days</Typography><FormGroup row>{weekdays.map((label, index) => <FormControlLabel key={label} label={label} control={<Checkbox disabled={!canManage || busy} checked={draft.calendar.workingDays.includes(index + 1)} onChange={(_, checked) => setDraft({ ...draft, calendar: { ...draft.calendar, workingDays: checked ? [...draft.calendar.workingDays, index + 1].sort() : draft.calendar.workingDays.filter((day) => day !== index + 1) } })} />} />)}</FormGroup></Box>
            <Typography variant="subtitle2">Working periods — gaps do not count toward SLA</Typography>
            {draft.calendar.periods.map((period, index) => <Stack key={index} direction="row" spacing={2}>
              {(["start", "end"] as const).map((field) => <TextField key={field} required label={`Period ${index + 1} ${field}`} type="time" value={period[field]} disabled={!canManage || busy} slotProps={{ inputLabel: { shrink: true } }} onChange={(event) => setDraft({ ...draft, calendar: { ...draft.calendar, periods: draft.calendar.periods.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: event.target.value } : item) } })} />)}
              {canManage ? <Button disabled={busy || draft.calendar.periods.length === 1} onClick={() => setDraft({ ...draft, calendar: { ...draft.calendar, periods: draft.calendar.periods.filter((_, itemIndex) => index !== itemIndex) } })}>Remove period {index + 1}</Button> : null}
            </Stack>)}
            {canManage ? <Button disabled={busy || draft.calendar.periods.length >= 24} sx={{ alignSelf: "flex-start" }} onClick={() => setDraft({ ...draft, calendar: { ...draft.calendar, periods: [...draft.calendar.periods, { start: "17:00", end: "18:00" }] } })}>Add working period</Button> : null}
            <TextField label="Excluded holiday dates" multiline minRows={3} disabled={!canManage || busy} value={holidays} onChange={(event) => setHolidays(event.target.value)} helperText="One YYYY-MM-DD date per line. Enter applicable holidays; they are not fetched automatically." />
          </Stack></Paper>
          {canManage ? <Button type="submit" variant="contained" disabled={busy} sx={{ alignSelf: "flex-start" }}>{busy ? "Saving…" : "Save SLA settings"}</Button> : <Alert severity="info">You have read-only access to SLA settings.</Alert>}
          <Paper sx={{ p: 2.5 }} elevation={0}><Typography variant="h6">Recent policy revisions</Typography>
            {!settings.history.length ? <Typography variant="body2">Approved defaults are shown. No configuration has been saved yet.</Typography> : <Stack component="ol" spacing={1}>{settings.history.map((item) => <Typography component="li" key={item.id} variant="body2">Revision {item.revision} · {item.actor?.firstName} {item.actor?.lastName} · {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""} · Response {item.configuration.responseHours}h / review {item.configuration.reviewHours}h</Typography>)}</Stack>}
          </Paper>
        </Stack>
      </Box> : null}
    </>}
  </Stack>;
}
