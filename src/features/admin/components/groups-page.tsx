"use client";

import { Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from "@mui/material";
import type { MRT_ColumnDef, MRT_PaginationState, MRT_SortingState } from "material-react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuthenticatedUser } from "@/features/auth/types";
import { addGroupMember, archiveGroup, createGroup, findMemberCandidates, GroupsRequestError, listGroupMembers, listGroups, removeGroupMember, updateGroup } from "@/services/groups";
import type { GroupMember, GroupMemberUser, GroupsResult, ManagedGroup } from "../groups.types";
import { PageHeader } from "./admin-page-primitives";
import { SaileAdminTable } from "./saile-admin-table";

const message = (error: unknown) => error instanceof Error ? error.message : "The request could not be completed.";

function GroupForm({ group, onClose, onSaved, onSignOut }: { group: ManagedGroup | null; onClose: () => void; onSaved: () => void; onSignOut: () => void }) {
  const [name, setName] = useState(group?.name ?? ""); const [description, setDescription] = useState(group?.description ?? "");
  const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [fields, setFields] = useState<Record<string, string>>({});
  async function submit(event: React.FormEvent) { event.preventDefault(); setSaving(true); setError(""); setFields({});
    try { const input = { name: name.trim(), description: description.trim() || null }; if (group) await updateGroup(group.id, input); else await createGroup(input); onSaved(); }
    catch (error) { if (error instanceof GroupsRequestError) { setFields(error.fields); if (error.status === 401) onSignOut(); } setError(message(error)); }
    finally { setSaving(false); }
  }
  return <Dialog open fullWidth maxWidth="sm" onClose={() => { if (!saving) onClose(); }} aria-labelledby="group-form-title"><form onSubmit={submit}>
    <DialogTitle id="group-form-title">{group ? "Edit group" : "Create group"}</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
      {error && <Alert severity="error">{error}</Alert>}<TextField autoFocus required label="Group name" value={name} disabled={saving} error={!!fields.name} helperText={fields.name} slotProps={{ htmlInput: { maxLength: 200 } }} onChange={(event) => setName(event.target.value)} />
      <TextField label="Description" multiline minRows={3} value={description} disabled={saving} error={!!fields.description} helperText={fields.description} slotProps={{ htmlInput: { maxLength: 1000 } }} onChange={(event) => setDescription(event.target.value)} />
    </Stack></DialogContent><DialogActions><Button disabled={saving} onClick={onClose}>Cancel</Button><Button disabled={saving || !name.trim()} type="submit" variant="contained">{saving ? "Saving…" : group ? "Save changes" : "Create group"}</Button></DialogActions>
  </form></Dialog>;
}

function MembersDialog({ group, canManage, onClose, onChanged, onSignOut }: { group: ManagedGroup; canManage: boolean; onClose: () => void; onChanged: () => void; onSignOut: () => void }) {
  const [members, setMembers] = useState<GroupMember[]>([]); const [candidates, setCandidates] = useState<GroupMemberUser[]>([]);
  const [selected, setSelected] = useState(""); const [search, setSearch] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const refresh = useCallback(async (signal?: AbortSignal) => { setLoading(true); setError(""); try { setMembers(await listGroupMembers(group.id, signal)); if (canManage) setCandidates(await findMemberCandidates(group.id, search, signal)); }
    catch (error) { if (error instanceof GroupsRequestError && error.status === 401) onSignOut(); setError(message(error)); } finally { setLoading(false); } }, [group.id, search, canManage, onSignOut]);
  useEffect(() => { const controller = new AbortController(); const timer = setTimeout(() => void refresh(controller.signal), 200); return () => { clearTimeout(timer); controller.abort(); }; }, [refresh]);
  async function add() { if (!selected) return; try { await addGroupMember(group.id, selected); setSelected(""); await refresh(); onChanged(); } catch (error) { if (error instanceof GroupsRequestError && error.status === 401) onSignOut(); setError(message(error)); } }
  async function remove(userId: string) { try { await removeGroupMember(group.id, userId); await refresh(); onChanged(); } catch (error) { if (error instanceof GroupsRequestError && error.status === 401) onSignOut(); setError(message(error)); } }
  return <Dialog open fullWidth maxWidth="md" onClose={onClose} aria-labelledby="members-title"><DialogTitle id="members-title">Members — {group.name}</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
    {error && <Alert severity="error">{error}</Alert>}{canManage && group.status === "ACTIVE" && <><TextField label="Search eligible users" value={search} onChange={(event) => setSearch(event.target.value)} /><Stack direction={{ xs: "column", sm: "row" }} spacing={1}><TextField select fullWidth label="Eligible user" value={selected} onChange={(event) => setSelected(event.target.value)}>{candidates.map((user) => <MenuItem key={user.id} value={user.id}>{user.firstName} {user.lastName} — {user.email}</MenuItem>)}</TextField><Button variant="contained" disabled={!selected || loading} onClick={add}>Add member</Button></Stack></>}
    {loading ? <Typography role="status">Loading members…</Typography> : members.length === 0 ? <Typography role="status">This group has no active members.</Typography> : members.map(({ user }) => <Stack key={user.id} direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}><Typography>{user.firstName} {user.lastName}<br/><Typography component="span" color="text.secondary" variant="caption">{user.email}</Typography></Typography>{canManage && group.status === "ACTIVE" && <Button color="warning" onClick={() => remove(user.id)}>Remove</Button>}</Stack>)}
  </Stack></DialogContent><DialogActions><Button onClick={onClose}>Close</Button></DialogActions></Dialog>;
}

export function GroupsPage({ currentUser, onSignOut }: { currentUser: AuthenticatedUser; onSignOut: () => void }) {
  const canRead = currentUser.permissions.includes("admin.groups.read"); const canCreate = currentUser.permissions.includes("admin.groups.create");
  const canUpdate = currentUser.permissions.includes("admin.groups.update"); const canArchive = currentUser.permissions.includes("admin.groups.archive");
  const canManage = currentUser.permissions.includes("admin.groups.members.manage") && currentUser.permissions.includes("admin.users.read");
  const [pagination, setPagination] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 }); const [sorting, setSorting] = useState<MRT_SortingState>([{ id: "createdAt", desc: true }]);
  const [search, setSearch] = useState(""); const [status, setStatus] = useState(""); const [result, setResult] = useState<GroupsResult | null>(null); const [loading, setLoading] = useState(canRead);
  const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [refresh, setRefresh] = useState(0); const [editing, setEditing] = useState<ManagedGroup | null | undefined>(); const [members, setMembers] = useState<ManagedGroup | null>(null);
  useEffect(() => { if (!canRead) return; const controller = new AbortController(); const timer = setTimeout(() => { setLoading(true); setError(""); const sort = sorting[0]; listGroups({ page: String(pagination.pageIndex + 1), pageSize: String(pagination.pageSize), search, sortBy: sort?.id ?? "createdAt", sortOrder: sort?.desc === false ? "asc" : "desc", ...(status ? { status } : {}) }, controller.signal).then(setResult).catch((error) => { if (!controller.signal.aborted) { setError(message(error)); if (error instanceof GroupsRequestError && error.status === 401) onSignOut(); } }).finally(() => !controller.signal.aborted && setLoading(false)); }, 250); return () => { clearTimeout(timer); controller.abort(); }; }, [canRead, pagination, sorting, search, status, refresh, onSignOut]);
  const columns = useMemo<MRT_ColumnDef<ManagedGroup>[]>(() => [
    { accessorKey: "name", header: "Group" }, { accessorKey: "status", header: "Status", Cell: ({ row }) => <Chip size="small" label={row.original.status === "ACTIVE" ? "Active" : "Archived"} /> },
    { id: "members", header: "Members", accessorFn: (row) => row._count.memberships, enableSorting: false }, { id: "permissions", header: "Permissions", accessorFn: (row) => row._count.permissionGrants, enableSorting: false },
    { accessorKey: "createdAt", header: "Created", Cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString() },
    { id: "actions", header: "Actions", enableSorting: false, Cell: ({ row }) => <Stack direction="row"><Button onClick={() => setMembers(row.original)}>Members</Button>{row.original.status === "ACTIVE" && canUpdate && <Button onClick={() => setEditing(row.original)}>Edit</Button>}{row.original.status === "ACTIVE" && canArchive && <Button color="warning" onClick={async () => { try { await archiveGroup(row.original.id); setNotice("Group archived and active memberships closed."); setRefresh((v) => v + 1); } catch (error) { setError(message(error)); } }}>Archive</Button>}</Stack> },
  ], [canUpdate, canArchive]);
  return <Stack spacing={3}><PageHeader title="Groups" description="Manage Bureau of the Treasury groups and retain membership history." action={canCreate ? { label: "Create group", onClick: () => setEditing(null) } : undefined} />
    {notice && <Alert severity="success" onClose={() => setNotice("")}>{notice}</Alert>}{!canRead ? <Alert severity="info">You do not have permission to view groups.</Alert> : <><Stack direction={{ xs: "column", sm: "row" }} spacing={2}><TextField fullWidth label="Search groups" value={search} onChange={(event) => { setSearch(event.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }} /><TextField select label="Status" value={status} sx={{ minWidth: 170 }} onChange={(event) => setStatus(event.target.value)}><MenuItem value="">All statuses</MenuItem><MenuItem value="ACTIVE">Active</MenuItem><MenuItem value="ARCHIVED">Archived</MenuItem></TextField><Button onClick={() => setRefresh((v) => v + 1)}>Refresh</Button></Stack>{error && <Alert severity="error">{error}</Alert>}<SaileAdminTable columns={columns} data={result?.data ?? []} getRowId={(row) => row.id} isLoading={loading} pagination={pagination} onPaginationChange={setPagination} sorting={sorting} onSortingChange={setSorting} rowCount={result?.meta.total ?? 0} />{!loading && !error && result?.meta.total === 0 && <Typography role="status">No groups match these filters.</Typography>}</>}
    {editing !== undefined && <GroupForm group={editing} onClose={() => setEditing(undefined)} onSignOut={onSignOut} onSaved={() => { setNotice(editing ? "Group updated." : "Group created."); setEditing(undefined); setRefresh((v) => v + 1); }} />}
    {members && <MembersDialog group={members} canManage={canManage} onClose={() => setMembers(null)} onSignOut={onSignOut} onChanged={() => setRefresh((v) => v + 1)} />}
  </Stack>;
}
