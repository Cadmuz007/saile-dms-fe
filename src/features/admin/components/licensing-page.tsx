"use client";

import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import PersonAddAltOutlined from "@mui/icons-material/PersonAddAltOutlined";
import VpnKeyOutlined from "@mui/icons-material/VpnKeyOutlined";
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, MenuItem, Paper, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import type { MRT_ColumnDef, MRT_PaginationState, MRT_SortingState } from "material-react-table";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { AuthenticatedUser } from "@/features/auth/types";
import { assignLicense, generateLicense, getLicenseHistory, LicensesRequestError, listEligibleLicenseUsers, listLicenses, reassignLicense, renewLicense, revokeLicenseAssignment } from "@/services/licenses";
import type { EffectiveLicenseStatus, EligibleLicenseUser, LicenseHistory, LicensesResult, ManagedLicense } from "../licenses.types";
import { MetricCard, PageHeader } from "./admin-page-primitives";
import { SaileAdminTable } from "./saile-admin-table";

const statusStyles: Record<EffectiveLicenseStatus, { backgroundColor: string; color: string }> = {
  AVAILABLE: { backgroundColor: "#ecfdf5", color: "#047857" },
  ASSIGNED: { backgroundColor: "#fdf2f8", color: "#9d174d" },
  EXPIRED: { backgroundColor: "#fff7ed", color: "#c2410c" },
  REVOKED: { backgroundColor: "#fff1f2", color: "#be123c" },
  ARCHIVED: { backgroundColor: "#f1f5f9", color: "#475569" },
};
const statusLabel = (status: EffectiveLicenseStatus) => status.charAt(0) + status.slice(1).toLowerCase();
const requestError = (error: unknown) => error instanceof Error ? error.message : "The request could not be completed.";
const historyEndLabel = (reason: "REVOKED" | "REASSIGNED" | "EXPIRED" | null) => reason === "REASSIGNED" ? "Reassigned" : reason === "EXPIRED" ? "Expired" : "Revoked";
function defaultExpiry() {
  const date = new Date(Date.now() + 365 * 86_400_000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}
function toApiExpiry(localValue: string) { return new Date(localValue).toISOString(); }

function ExpiryDialog({ license, onClose, onSaved, onSignOut }: { license?: ManagedLicense; onClose: () => void; onSaved: (message: string) => void; onSignOut: () => void }) {
  const [expiresAt, setExpiresAt] = useState(() => license ? (() => { const date = new Date(license.expiresAt); date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); return date.toISOString().slice(0, 16); })() : defaultExpiry());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError("");
    try {
      const value = toApiExpiry(expiresAt);
      if (license) await renewLicense(license.id, value); else await generateLicense(value);
      onSaved(license ? "License expiry updated." : "License generated and ready for assignment.");
    } catch (error) {
      setError(requestError(error));
      if (error instanceof LicensesRequestError && error.status === 401) onSignOut();
    } finally { setSaving(false); }
  }
  return <Dialog open fullWidth maxWidth="xs" onClose={() => { if (!saving) onClose(); }} aria-labelledby="license-expiry-title">
    <form onSubmit={submit}><DialogTitle id="license-expiry-title">{license ? "Update license expiry" : "Generate license"}</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <Alert severity="info">{license ? "Updating an expired license makes it active again." : "The license number is generated securely by the server."}</Alert>
        <TextField autoFocus required fullWidth type="datetime-local" label="Expiry date and time" value={expiresAt} disabled={saving}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: new Date().toISOString().slice(0, 16) } }}
          onChange={(event) => setExpiresAt(event.target.value)} />
      </Stack></DialogContent>
      <DialogActions sx={{ p: 2.5 }}><Button disabled={saving} onClick={onClose}>Cancel</Button><Button disabled={saving || !expiresAt} type="submit" variant="contained">{saving ? "Saving…" : license ? "Save expiry" : "Generate license"}</Button></DialogActions>
    </form>
  </Dialog>;
}

function AssignmentDialog({ license, reassign, onClose, onSaved, onSignOut }: { license: ManagedLicense; reassign: boolean; onClose: () => void; onSaved: (message: string) => void; onSignOut: () => void }) {
  const [users, setUsers] = useState<EligibleLicenseUser[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true); setError("");
      listEligibleLicenseUsers(search, page, controller.signal).then((items) => { if (!controller.signal.aborted) setUsers(items); }).catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setUsers([]); setError(requestError(error));
        if (error instanceof LicensesRequestError && error.status === 401) onSignOut();
      }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [search, page, retry, onSignOut]);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!userId || saving) return;
    setSaving(true); setError("");
    try {
      if (reassign) await reassignLicense(license.id, userId); else await assignLicense(license.id, userId);
      onSaved(reassign ? "License reassigned. The previous assignment remains in history." : "License assigned.");
    } catch (error) {
      setError(requestError(error)); setUserId(""); setRetry((value) => value + 1);
      if (error instanceof LicensesRequestError && error.status === 401) onSignOut();
    } finally { setSaving(false); }
  }
  return <Dialog open fullWidth maxWidth="sm" onClose={() => { if (!saving) onClose(); }} aria-labelledby="assign-license-title">
    <form onSubmit={submit}><DialogTitle id="assign-license-title">{reassign ? "Reassign" : "Assign"} {license.licenseNumber}</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
        {reassign && <Alert severity="warning">The current assignment will be closed and retained in history.</Alert>}
        {error && <Alert severity="error" action={<Button onClick={() => setRetry((value) => value + 1)}>Retry</Button>}>{error}</Alert>}
        <TextField label="Find eligible user" value={search} disabled={saving} slotProps={{ htmlInput: { maxLength: 200 } }} onChange={(event) => { setSearch(event.target.value); setPage(1); setUserId(""); }} />
        <TextField required select label="Eligible user" value={userId} disabled={saving || loading || !!error}
          helperText={loading ? "Loading users…" : users.length ? "Users with an active license or archived accounts are excluded." : "No eligible users match."}
          onChange={(event) => setUserId(event.target.value)}>
          {users.map((user) => <MenuItem key={user.id} value={user.id}>{user.firstName} {user.lastName} — {user.email}</MenuItem>)}
        </TextField>
        <Stack direction="row" spacing={1}><Button disabled={saving || loading || page === 1} onClick={() => { setPage(page - 1); setUserId(""); }}>Previous users</Button><Button disabled={saving || loading || users.length < 25} onClick={() => { setPage(page + 1); setUserId(""); }}>More users</Button></Stack>
      </Stack></DialogContent>
      <DialogActions sx={{ p: 2.5 }}><Button disabled={saving} onClick={onClose}>Cancel</Button><Button disabled={saving || loading || !userId} type="submit" variant="contained">{saving ? "Saving…" : reassign ? "Reassign license" : "Assign license"}</Button></DialogActions>
    </form>
  </Dialog>;
}

function HistoryDialog({ license, onClose, onSignOut }: { license: ManagedLicense; onClose: () => void; onSignOut: () => void }) {
  const [history, setHistory] = useState<LicenseHistory | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    getLicenseHistory(license.id, controller.signal).then((value) => { if (!controller.signal.aborted) setHistory(value); }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      setError(requestError(error)); if (error instanceof LicensesRequestError && error.status === 401) onSignOut();
    });
    return () => controller.abort();
  }, [license.id, retry, onSignOut]);
  return <Dialog open fullWidth maxWidth="md" onClose={onClose} aria-labelledby="license-history-title"><DialogTitle id="license-history-title">Assignment history — {license.licenseNumber}</DialogTitle>
    <DialogContent><Stack divider={<Divider flexItem />} spacing={2} sx={{ pt: 1 }}>
      {error && <Alert severity="error" action={<Button onClick={() => { setHistory(null); setError(""); setRetry((value) => value + 1); }}>Retry</Button>}>{error}</Alert>}
      {!error && !history && <Typography role="status">Loading assignment history…</Typography>}
      {history?.assignments.length === 0 && <Typography role="status">This license has never been assigned.</Typography>}
      {history?.assignments.map((entry) => <Box key={entry.id}>
        <Typography sx={{ fontWeight: 700 }}>{entry.user.firstName} {entry.user.lastName}</Typography><Typography color="text.secondary" variant="body2">{entry.user.email}</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>Assigned {new Date(entry.assignedAt).toLocaleString()}{entry.assignedByUser ? ` by ${entry.assignedByUser.firstName} ${entry.assignedByUser.lastName}` : ""}</Typography>
        <Typography variant="body2">{entry.endedAt ? `${historyEndLabel(entry.endReason)} ${new Date(entry.endedAt).toLocaleString()}${entry.endedByUser ? ` by ${entry.endedByUser.firstName} ${entry.endedByUser.lastName}` : ""}` : "Current assignment"}</Typography>
      </Box>)}
    </Stack></DialogContent><DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
  </Dialog>;
}

export function LicensingPage({ currentUser, onSignOut, onMetricsChange }: { currentUser: AuthenticatedUser; onSignOut: () => void; onMetricsChange: (metrics: LicensesResult["meta"]["metrics"]) => void }) {
  const canRead = currentUser.permissions.includes("admin.licenses.read");
  const canCreate = currentUser.permissions.includes("admin.licenses.create");
  const canUpdate = currentUser.permissions.includes("admin.licenses.update");
  const canAssign = currentUser.permissions.includes("admin.licenses.assign") && currentUser.permissions.includes("admin.users.read");
  const canRevoke = currentUser.permissions.includes("admin.licenses.revoke");
  const canReassign = canAssign && canRevoke;
  const [pagination, setPagination] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<MRT_SortingState>([{ id: "createdAt", desc: true }]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | EffectiveLicenseStatus>("");
  const [result, setResult] = useState<LicensesResult | null>(null);
  const [loading, setLoading] = useState(canRead);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [expiryLicense, setExpiryLicense] = useState<ManagedLicense | null | undefined>();
  const [assignment, setAssignment] = useState<{ license: ManagedLicense; reassign: boolean } | null>(null);
  const [historyLicense, setHistoryLicense] = useState<ManagedLicense | null>(null);
  const [revokeLicense, setRevokeLicense] = useState<ManagedLicense | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState("");

  useEffect(() => {
    if (!canRead) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true); setError("");
      const sort = sorting[0];
      listLicenses({ page: String(pagination.pageIndex + 1), pageSize: String(pagination.pageSize), search,
        sortBy: sort?.id ?? "createdAt", sortOrder: sort?.desc === false ? "asc" : "desc", ...(status ? { status } : {}) }, controller.signal)
        .then((response) => {
          if (controller.signal.aborted) return;
          if (response.meta.total > 0 && pagination.pageIndex * pagination.pageSize >= response.meta.total) setPagination((current) => ({ ...current, pageIndex: 0 }));
          setResult(response); onMetricsChange(response.meta.metrics);
        }).catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setResult(null); setError(requestError(error)); if (error instanceof LicensesRequestError && error.status === 401) onSignOut();
        }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [canRead, pagination, sorting, search, status, refresh, onSignOut, onMetricsChange]);

  function saved(message: string) { setNotice(message); setExpiryLicense(undefined); setAssignment(null); setRefresh((value) => value + 1); }
  async function confirmRevoke() {
    if (!revokeLicense || revoking) return;
    setRevoking(true); setRevokeError("");
    try { await revokeLicenseAssignment(revokeLicense.id); setRevokeLicense(null); setNotice("Assignment revoked and retained in license history."); setRefresh((value) => value + 1); }
    catch (error) { setRevokeError(requestError(error)); if (error instanceof LicensesRequestError && error.status === 401) onSignOut(); }
    finally { setRevoking(false); }
  }

  const columns = useMemo<MRT_ColumnDef<ManagedLicense>[]>(() => [
    { accessorKey: "licenseNumber", header: "License number", Cell: ({ cell }) => <Typography sx={{ color: "#810a6a", fontFamily: "monospace", fontSize: 12, fontWeight: 750 }}>{cell.getValue<string>()}</Typography> },
    { id: "assignee", header: "Assigned user", enableSorting: false, Cell: ({ row }) => row.original.activeAssignment ? <Box><Typography sx={{ fontSize: 13, fontWeight: 700 }}>{row.original.activeAssignment.user.firstName} {row.original.activeAssignment.user.lastName}</Typography><Typography color="text.secondary" sx={{ fontSize: 11 }}>{row.original.activeAssignment.user.email}</Typography></Box> : "—" },
    { accessorKey: "issuedAt", header: "Issued", Cell: ({ row }) => new Date(row.original.issuedAt).toLocaleDateString() },
    { accessorKey: "expiresAt", header: "Expires", Cell: ({ row }) => new Date(row.original.expiresAt).toLocaleString() },
    { accessorKey: "status", header: "Status", Cell: ({ row }) => <Chip label={statusLabel(row.original.effectiveStatus)} size="small" sx={{ ...statusStyles[row.original.effectiveStatus], fontWeight: 700 }} /> },
    { id: "actions", header: "Actions", enableSorting: false, Cell: ({ row }) => <Stack direction="row" sx={{ flexWrap: "wrap" }}>
      <Button startIcon={<HistoryOutlined />} onClick={() => setHistoryLicense(row.original)}>History</Button>
      {canUpdate && row.original.effectiveStatus !== "ARCHIVED" && row.original.effectiveStatus !== "REVOKED" && <Button onClick={() => setExpiryLicense(row.original)}>Expiry</Button>}
      {canAssign && row.original.effectiveStatus === "AVAILABLE" && <Button onClick={() => setAssignment({ license: row.original, reassign: false })}>Assign</Button>}
      {canReassign && row.original.effectiveStatus === "ASSIGNED" && <Button onClick={() => setAssignment({ license: row.original, reassign: true })}>Reassign</Button>}
      {canRevoke && row.original.activeAssignment && <Button color="warning" onClick={() => { setRevokeError(""); setRevokeLicense(row.original); }}>Revoke</Button>}
    </Stack> },
  ], [canAssign, canReassign, canRevoke, canUpdate]);

  const metrics = result?.meta.metrics;
  return <Stack spacing={3}>
    <PageHeader title="Licensing" description="Issue licenses and preserve their complete assignment history." action={canCreate ? { label: "Generate license", icon: <VpnKeyOutlined />, onClick: () => setExpiryLicense(null) } : undefined} />
    {notice && <Alert severity="success" onClose={() => setNotice("")}>{notice}</Alert>}
    {!canRead ? <Alert severity="info">You do not have permission to view licenses.</Alert> : <>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" } }}>
        <MetricCard icon={<VpnKeyOutlined />} label="Enabled licenses" value={String(metrics?.enabled ?? "—")} detail="Active and unexpired records" />
        <MetricCard color="#059669" icon={<PersonAddAltOutlined />} label="Available" value={String(metrics?.available ?? "—")} detail="Active and ready to assign" />
        <MetricCard color="#2563eb" icon={<PersonAddAltOutlined />} label="Assigned" value={String(metrics?.assigned ?? "—")} detail="Current active assignments" />
        <MetricCard color="#c2410c" icon={<VpnKeyOutlined />} label="Expired" value={String(metrics?.expired ?? "—")} detail="Renew before reassignment" />
      </Box>
      <Paper elevation={0}><Tabs aria-label="License status" value={status} onChange={(_, value: typeof status) => { setStatus(value); setPagination((current) => ({ ...current, pageIndex: 0 })); }} variant="scrollable">
        <Tab label="All" value="" /><Tab label="Available" value="AVAILABLE" /><Tab label="Assigned" value="ASSIGNED" /><Tab label="Expired" value="EXPIRED" /><Tab label="Revoked" value="REVOKED" /><Tab label="Archived" value="ARCHIVED" />
      </Tabs></Paper>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}><TextField fullWidth label="Search licenses" placeholder="License number or current assignee" value={search} slotProps={{ htmlInput: { maxLength: 200 } }} onChange={(event) => { setSearch(event.target.value); setPagination((current) => ({ ...current, pageIndex: 0 })); }} /><Button disabled={loading} onClick={() => setRefresh((value) => value + 1)}>Refresh</Button></Stack>
      {error && <Alert severity="error" action={<Button onClick={() => setRefresh((value) => value + 1)}>Retry</Button>}>{error}</Alert>}
      <SaileAdminTable columns={columns} data={result?.data ?? []} getRowId={(row) => row.id} isLoading={loading} pagination={pagination} onPaginationChange={setPagination}
        sorting={sorting} onSortingChange={(updater) => { setSorting(updater); setPagination((current) => ({ ...current, pageIndex: 0 })); }} rowCount={result?.meta.total ?? 0} />
      {!loading && !error && result?.meta.total === 0 && <Typography role="status">No licenses match these filters.</Typography>}
    </>}
    {expiryLicense !== undefined && <ExpiryDialog license={expiryLicense ?? undefined} onClose={() => setExpiryLicense(undefined)} onSaved={saved} onSignOut={onSignOut} />}
    {assignment && <AssignmentDialog license={assignment.license} reassign={assignment.reassign} onClose={() => setAssignment(null)} onSaved={saved} onSignOut={onSignOut} />}
    {historyLicense && <HistoryDialog license={historyLicense} onClose={() => setHistoryLicense(null)} onSignOut={onSignOut} />}
    <Dialog open={!!revokeLicense} onClose={() => { if (!revoking) setRevokeLicense(null); }} aria-labelledby="revoke-license-title"><DialogTitle id="revoke-license-title">Revoke assignment?</DialogTitle><DialogContent><Stack spacing={2}>
      <Typography>{revokeLicense?.licenseNumber} will be released from {revokeLicense?.activeAssignment?.user.firstName} {revokeLicense?.activeAssignment?.user.lastName}. The assignment remains in history.</Typography>
      {revokeLicense?.activeAssignment?.user.id === currentUser.id && <Alert severity="warning">This is your license. Your current session will lose access after revocation.</Alert>}
      {revokeError && <Alert severity="error">{revokeError}</Alert>}
    </Stack></DialogContent><DialogActions><Button disabled={revoking} onClick={() => setRevokeLicense(null)}>Cancel</Button><Button color="warning" variant="contained" disabled={revoking} onClick={confirmRevoke}>{revoking ? "Revoking…" : "Revoke assignment"}</Button></DialogActions></Dialog>
  </Stack>;
}
