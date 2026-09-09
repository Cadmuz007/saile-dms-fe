"use client";

import { Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from "@mui/material";
import type { MRT_ColumnDef, MRT_PaginationState, MRT_SortingState } from "material-react-table";
import { useEffect, useMemo, useState } from "react";
import type { AuthenticatedUser } from "@/features/auth/types";
import { archiveUser, createUser, findAvailableLicenses, listUsers, updateUser, UsersRequestError } from "@/services/users";
import type { AvailableLicense, ManagedUser, UsersResult } from "../users.types";
import { PageHeader } from "./admin-page-primitives";
import { SaileAdminTable } from "./saile-admin-table";

function errorMessage(error: unknown) { return error instanceof Error ? error.message : "The request could not be completed."; }

function UserForm({ user, onClose, onSaved, onSignOut }: {
  user: ManagedUser | null; onClose: () => void; onSaved: () => void; onSignOut: () => void;
}) {
  const [form, setForm] = useState({ firstName: user?.firstName ?? "", lastName: user?.lastName ?? "", email: user?.email ?? "",
    employeeId: user?.employeeId ?? "", mobileNumber: user?.mobileNumber ?? "", password: "", licenseId: "" });
  const [licenses, setLicenses] = useState<AvailableLicense[]>([]);
  const [licenseSearch, setLicenseSearch] = useState("");
  const [licensePage, setLicensePage] = useState(1);
  const [licenseLoading, setLicenseLoading] = useState(!user);
  const [licenseError, setLicenseError] = useState("");
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLicenseLoading(true);
      setLicenseError("");
      findAvailableLicenses(licenseSearch, licensePage, controller.signal).then((items) => {
        if (!controller.signal.aborted) setLicenses(items);
      }).catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof UsersRequestError && error.status === 401) onSignOut();
        setLicenseError(errorMessage(error));
        setLicenses([]);
      }).finally(() => { if (!controller.signal.aborted) setLicenseLoading(false); });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [licenseSearch, licensePage, retry, user, onSignOut]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError(""); setFields({});
    const profile = { firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim(),
      employeeId: form.employeeId.trim() || null, mobileNumber: form.mobileNumber.trim() || null };
    try {
      if (user) await updateUser(user.id, profile);
      else await createUser({ ...profile, password: form.password, licenseId: form.licenseId });
      onSaved();
    } catch (error) {
      if (error instanceof UsersRequestError) {
        setFields(error.fields);
        if (error.status === 401) onSignOut();
        if (error.status === 409 && !user) {
          setForm((current) => ({ ...current, licenseId: "" }));
          setRetry((current) => current + 1);
        }
      }
      setError(errorMessage(error));
    } finally { setSaving(false); }
  }

  return <Dialog open fullWidth maxWidth="sm" onClose={() => { if (!saving) onClose(); }} aria-labelledby="user-form-title">
    <form onSubmit={submit}>
      <DialogTitle id="user-form-title">{user ? "Edit user" : "Create user account"}</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
        {error && <Alert severity="error">{error}</Alert>}
        {([['firstName', 'First name', 100], ['lastName', 'Last name', 100], ['email', 'Email', 320], ['employeeId', 'Employee ID', 100], ['mobileNumber', 'Mobile number', 50]] as const).map(([key, label, maxLength], index) =>
          <TextField key={key} autoFocus={index === 0} fullWidth required={['firstName', 'lastName', 'email'].includes(key)}
            label={label} type={key === 'email' ? 'email' : 'text'} value={form[key]} disabled={saving}
            error={!!fields[key]} helperText={fields[key]} slotProps={{ htmlInput: { maxLength } }}
            onChange={(event) => setForm({ ...form, [key]: event.target.value })} />)}
        {!user && <>
          <TextField required fullWidth label="Initial password" type="password" autoComplete="new-password" value={form.password} disabled={saving}
            error={!!fields.password} helperText={fields.password ?? "Use at least 12 characters. Provide this password to the user securely."}
            slotProps={{ htmlInput: { minLength: 12, maxLength: 1024 } }} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          <Typography variant="body2">An available license is required. The account can sign in immediately after creation.</Typography>
          <TextField label="Find available license" value={licenseSearch} disabled={saving} onChange={(event) => {
            setLicenseSearch(event.target.value); setLicensePage(1); setLicenseLoading(true); setForm({ ...form, licenseId: "" });
          }} />
          {licenseError && <Alert severity="error" action={<Button onClick={() => setRetry((current) => current + 1)}>Retry</Button>}>{licenseError}</Alert>}
          <TextField select required label="Available license" value={form.licenseId} disabled={saving || licenseLoading || !!licenseError}
            error={!!fields.licenseId} helperText={fields.licenseId ?? (licenseLoading ? "Loading licenses…" : licenses.length ? "" : "No available licenses match. Ask a licensing administrator to make one available.")}
            onChange={(event) => setForm({ ...form, licenseId: event.target.value })}>
            {licenses.map((license) => <MenuItem key={license.id} value={license.id}>{license.licenseNumber} — expires {new Date(license.expiresAt).toLocaleDateString()}</MenuItem>)}
          </TextField>
          <Stack direction="row" spacing={1}>
            <Button disabled={saving || licenseLoading || licensePage === 1} onClick={() => { setLicensePage(licensePage - 1); setLicenseLoading(true); setForm({ ...form, licenseId: "" }); }}>Previous licenses</Button>
            <Button disabled={saving || licenseLoading || licenses.length < 25} onClick={() => { setLicensePage(licensePage + 1); setLicenseLoading(true); setForm({ ...form, licenseId: "" }); }}>More licenses</Button>
          </Stack>
        </>}
      </Stack></DialogContent>
      <DialogActions sx={{ p: 2.5 }}><Button disabled={saving} onClick={onClose}>Cancel</Button><Button type="submit" variant="contained" disabled={saving || (!user && (!form.licenseId || licenseLoading || !!licenseError))}>{saving ? "Saving…" : user ? "Save changes" : "Create user"}</Button></DialogActions>
    </form>
  </Dialog>;
}

export function UsersPage({ currentUser, onSignOut }: { currentUser: AuthenticatedUser; onSignOut: () => void }) {
  const canRead = currentUser.permissions.includes("admin.users.read");
  const canCreate = ["admin.users.create", "admin.licenses.assign"].every((key) => currentUser.permissions.includes(key));
  const canUpdate = currentUser.permissions.includes("admin.users.update");
  const canArchive = currentUser.permissions.includes("admin.users.archive");
  const [pagination, setPagination] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<MRT_SortingState>([{ id: "createdAt", desc: true }]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<UsersResult | null>(null);
  const [loading, setLoading] = useState(canRead);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [editing, setEditing] = useState<ManagedUser | null | undefined>();
  const [archiving, setArchiving] = useState<ManagedUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [archiveError, setArchiveError] = useState("");

  useEffect(() => {
    if (!canRead) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true); setError("");
      const sort = sorting[0];
      listUsers({ page: String(pagination.pageIndex + 1), pageSize: String(pagination.pageSize), search,
        sortBy: sort?.id ?? "createdAt", sortOrder: sort?.desc === false ? "asc" : "desc", ...(status ? { status } : {}) }, controller.signal)
        .then((response) => {
          if (controller.signal.aborted) return;
          if (response.meta.total > 0 && pagination.pageIndex * pagination.pageSize >= response.meta.total) {
            setPagination((current) => ({ ...current, pageIndex: 0 }));
          }
          setResult(response);
        }).catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setError(errorMessage(error)); setResult(null);
          if (error instanceof UsersRequestError && error.status === 401) onSignOut();
        }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [canRead, pagination, sorting, search, status, refresh, onSignOut]);

  const columns = useMemo<MRT_ColumnDef<ManagedUser>[]>(() => [
    { accessorKey: "firstName", header: "First name" }, { accessorKey: "lastName", header: "Last name" },
    { accessorKey: "email", header: "Email" }, { accessorKey: "employeeId", header: "Employee ID" },
    { accessorKey: "status", header: "Status", Cell: ({ row }) => <Chip size="small" label={row.original.status.charAt(0) + row.original.status.slice(1).toLowerCase()} /> },
    { accessorKey: "createdAt", header: "Created", Cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString() },
    { accessorKey: "lastSignInAt", header: "Last sign-in", Cell: ({ row }) => row.original.lastSignInAt ? new Date(row.original.lastSignInAt).toLocaleString() : "Never" },
    { id: "actions", header: "Actions", enableSorting: false, Cell: ({ row }) => row.original.status !== "ARCHIVED" && <Stack direction="row">
      {canUpdate && <Button aria-label={`Edit ${row.original.firstName} ${row.original.lastName}`} onClick={() => setEditing(row.original)}>Edit</Button>}
      {canArchive && <Button color="warning" aria-label={`Archive ${row.original.firstName} ${row.original.lastName}`} onClick={() => { setArchiveError(""); setArchiving(row.original); }}>Archive</Button>}
    </Stack> },
  ], [canUpdate, canArchive]);

  async function confirmArchive() {
    if (!archiving || saving) return;
    setSaving(true); setArchiveError("");
    try {
      await archiveUser(archiving.id);
      if (archiving.id === currentUser.id) { onSignOut(); return; }
      setArchiving(null); setNotice("User archived. Their license assignment and history have been retained."); setRefresh((value) => value + 1);
    } catch (error) {
      setArchiveError(errorMessage(error));
      if (error instanceof UsersRequestError && error.status === 401) onSignOut();
    } finally { setSaving(false); }
  }

  return <Stack spacing={3}>
    <PageHeader title="Users" description="Manage organization accounts and preserve their access history."
      action={canCreate ? { label: "Create user", onClick: () => setEditing(null) } : undefined} />
    {notice && <Alert severity="success" onClose={() => setNotice("")}>{notice}</Alert>}
    {!canRead ? <Alert severity="info">You do not have permission to view users.</Alert> : <>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField fullWidth label="Search users" placeholder="Name, email, or employee ID" value={search} slotProps={{ htmlInput: { maxLength: 200 } }} onChange={(event) => { setSearch(event.target.value); setPagination({ ...pagination, pageIndex: 0 }); }} />
        <TextField select label="Account status" sx={{ minWidth: 180 }} value={status} onChange={(event) => { setStatus(event.target.value); setPagination({ ...pagination, pageIndex: 0 }); }}>
          <MenuItem value="">All statuses</MenuItem>{["ACTIVE", "INVITED", "INACTIVE", "BLOCKED", "ARCHIVED"].map((value) => <MenuItem key={value} value={value}>{value.charAt(0) + value.slice(1).toLowerCase()}</MenuItem>)}
        </TextField>
        <Button onClick={() => setRefresh((value) => value + 1)} disabled={loading}>Refresh</Button>
      </Stack>
      {error && <Alert severity="error" action={<Button onClick={() => setRefresh((value) => value + 1)}>Retry</Button>}>{error}</Alert>}
      <SaileAdminTable columns={columns} data={result?.data ?? []} getRowId={(row) => row.id} isLoading={loading}
        pagination={pagination} onPaginationChange={setPagination} sorting={sorting}
        onSortingChange={(updater) => { setSorting(updater); setPagination((current) => ({ ...current, pageIndex: 0 })); }} rowCount={result?.meta.total ?? 0} />
      {!loading && !error && result?.meta.total === 0 && <Typography role="status">No users match these filters.</Typography>}
    </>}
    {editing !== undefined && <UserForm user={editing} onSignOut={onSignOut} onClose={() => setEditing(undefined)} onSaved={() => {
      setNotice(editing ? "User profile updated." : "User created and license assigned."); setEditing(undefined); setRefresh((value) => value + 1);
    }} />}
    <Dialog open={!!archiving} onClose={() => { if (!saving) setArchiving(null); }} aria-labelledby="archive-user-title">
      <DialogTitle id="archive-user-title">Archive user?</DialogTitle><DialogContent><Stack spacing={2}>
        <Typography>{archiving?.firstName} {archiving?.lastName} will lose sign-in access. Their license assignment, memberships, and permission history will be retained.</Typography>
        {archiving?.id === currentUser.id && <Alert severity="warning">This is your account. You will be signed out after archival.</Alert>}
        {archiveError && <Alert severity="error">{archiveError}</Alert>}
      </Stack></DialogContent><DialogActions><Button disabled={saving} onClick={() => setArchiving(null)}>Cancel</Button><Button color="warning" variant="contained" disabled={saving} onClick={confirmArchive}>{saving ? "Archiving…" : "Archive user"}</Button></DialogActions>
    </Dialog>
  </Stack>;
}
