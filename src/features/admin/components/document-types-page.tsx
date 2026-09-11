"use client";

import ArrowDownwardRounded from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRounded from "@mui/icons-material/ArrowUpwardRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import { Alert, Autocomplete, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import type { MRT_ColumnDef, MRT_PaginationState, MRT_SortingState } from "material-react-table";
import { useEffect, useMemo, useState } from "react";

import type { AuthenticatedUser } from "@/features/auth/types";
import { archiveDocumentType, createDocumentType, DocumentTypesRequestError, listDocumentTypes, listVisibilityCandidates, updateDocumentType } from "@/services/document-types";
import type { DocumentTypeFieldInput, DocumentTypeInput, DocumentTypesResult, ManagedDocumentType, MetadataFieldKind, VisibilityCandidates, VisibilityUser, VisibilityGroup } from "../document-types.types";
import { PageHeader } from "./admin-page-primitives";
import { SaileAdminTable } from "./saile-admin-table";

const fieldKinds: Array<{ value: MetadataFieldKind; label: string }> = [
  { value: "SHORT_TEXT", label: "Short text" },
  { value: "LONG_TEXT", label: "Long text" },
  { value: "DATE", label: "Date" },
  { value: "SINGLE_SELECT", label: "Single choice" },
];

const blankField = (): DocumentTypeFieldInput => ({ label: "", kind: "SHORT_TEXT", helpText: null, isRequired: false, options: [] });
const errorMessage = (error: unknown) => error instanceof Error ? error.message : "The request could not be completed.";

function DocumentTypeForm({ documentType, onClose, onSaved, onSignOut }: {
  documentType: ManagedDocumentType | null; onClose: () => void; onSaved: () => void; onSignOut: () => void;
}) {
  const [name, setName] = useState(documentType?.name ?? "");
  const [description, setDescription] = useState(documentType?.description ?? "");
  const [fields, setFields] = useState<DocumentTypeFieldInput[]>(documentType?.fields.map((field) => ({ id: field.id, label: field.label, kind: field.kind, helpText: field.helpText, isRequired: field.isRequired, options: field.options })) ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [restricted, setRestricted] = useState(documentType?.visibilityRestricted ?? false);
  const [visibilityUsers, setVisibilityUsers] = useState<VisibilityUser[]>(documentType?.visibilityGrants?.flatMap((grant) => grant.user ? [grant.user] : []) ?? []);
  const [visibilityGroups, setVisibilityGroups] = useState<VisibilityGroup[]>(documentType?.visibilityGrants?.flatMap((grant) => grant.group ? [grant.group] : []) ?? []);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidates, setCandidates] = useState<VisibilityCandidates>({ users: [], groups: [] });
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState("");
  const [candidateRetry, setCandidateRetry] = useState(0);

  useEffect(() => {
    if (!restricted) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setCandidatesLoading(true); setCandidatesError("");
      listVisibilityCandidates(candidateSearch, controller.signal)
        .then((result) => { if (!controller.signal.aborted) setCandidates(result); })
        .catch((requestError: unknown) => {
          if (controller.signal.aborted) return;
          setCandidatesError(errorMessage(requestError)); setCandidates({ users: [], groups: [] });
          if (requestError instanceof DocumentTypesRequestError && requestError.status === 401) onSignOut();
        })
        .finally(() => { if (!controller.signal.aborted) setCandidatesLoading(false); });
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [restricted, candidateSearch, candidateRetry, onSignOut]);

  function updateField(index: number, next: Partial<DocumentTypeFieldInput>) {
    setFields((current) => current.map((field, fieldIndex) => fieldIndex === index ? { ...field, ...next } : field));
  }

  function moveField(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    setFields((current) => { const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError(""); setFieldErrors({});
    const input: DocumentTypeInput = {
      name: name.trim(), description: description.trim() || null,
      visibility: { restricted, userIds: restricted ? visibilityUsers.map((user) => user.id) : [], groupIds: restricted ? visibilityGroups.map((group) => group.id) : [] },
      ...(documentType ? { expectedVisibilityRevision: documentType.visibilityRevision } : {}),
      fields: fields.map((field) => ({ ...field, label: field.label.trim(), helpText: field.helpText?.trim() || null, options: field.kind === "SINGLE_SELECT" ? field.options.map((option) => option.trim()).filter(Boolean) : [] })),
    };
    try {
      if (documentType) await updateDocumentType(documentType.id, input);
      else await createDocumentType(input);
      onSaved();
    } catch (requestError) {
      if (requestError instanceof DocumentTypesRequestError) { setFieldErrors(requestError.fields); if (requestError.status === 401) onSignOut(); }
      setError(errorMessage(requestError));
    } finally { setSaving(false); }
  }

  return <Dialog open fullWidth maxWidth="md" onClose={() => { if (!saving) onClose(); }} aria-labelledby="document-type-form-title">
    <form onSubmit={submit}>
      <DialogTitle id="document-type-form-title">{documentType ? "Edit document type" : "Create document type"}</DialogTitle>
      <DialogContent><Stack spacing={2.5} sx={{ pt: 1 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <Alert severity="info">Attachment metadata fields are not available yet. Files can be added as document attachments after upload.</Alert>
        <TextField autoFocus required fullWidth label="Document type name" value={name} disabled={saving} error={!!fieldErrors.name} helperText={fieldErrors.name} slotProps={{ htmlInput: { maxLength: 160 } }} onChange={(event) => setName(event.target.value)} />
        <TextField fullWidth multiline minRows={2} label="Description" value={description} disabled={saving} error={!!fieldErrors.description} helperText={fieldErrors.description} slotProps={{ htmlInput: { maxLength: 1000 } }} onChange={(event) => setDescription(event.target.value)} />
        <Box component="fieldset" sx={{ m: 0, p: 2, border: "1px solid #e2e8f0", borderRadius: 1 }}>
          <Typography component="legend" sx={{ px: 1, fontSize: 16, fontWeight: 750 }}>Visibility Settings</Typography>
          <Stack spacing={2}>
            <TextField select fullWidth label="Who can see documents of this type?" value={restricted ? "SELECTED" : "EXISTING"} disabled={saving} onChange={(event) => setRestricted(event.target.value === "SELECTED")}>
              <MenuItem value="EXISTING">Use existing document access</MenuItem>
              <MenuItem value="SELECTED">Selected users and groups</MenuItem>
            </TextField>
            <Typography sx={{ color: "text.secondary", fontSize: 13 }}>{restricted ? "Only selected users and current members of selected active groups can see these documents. They must also have document access. Folder sharing, Public visibility, ownership, and workflow assignment do not bypass this restriction." : "Documents follow their existing library, folder, sharing, and workflow access rules."}</Typography>
            {restricted && <>
              <TextField size="small" label="Search users and groups" value={candidateSearch} disabled={saving} onChange={(event) => setCandidateSearch(event.target.value)} helperText="Up to 50 matches of each kind. Search to find more recipients." />
              {candidatesError && <Alert severity="error" action={<Button onClick={() => setCandidateRetry((value) => value + 1)}>Retry</Button>}>{candidatesError}</Alert>}
              <Autocomplete multiple disableCloseOnSelect options={candidates.users} value={visibilityUsers} loading={candidatesLoading} disabled={saving} filterOptions={(options) => options} isOptionEqualToValue={(option, value) => option.id === value.id} getOptionLabel={(user) => `${user.firstName} ${user.lastName} (${user.email})${user.status !== "ACTIVE" ? " — inactive" : ""}`} onChange={(_, value) => setVisibilityUsers(value)} renderInput={(params) => <TextField {...params} label="Visible to users" placeholder="Select users" />} noOptionsText="No matching active users" />
              <Autocomplete multiple disableCloseOnSelect options={candidates.groups} value={visibilityGroups} loading={candidatesLoading} disabled={saving} filterOptions={(options) => options} isOptionEqualToValue={(option, value) => option.id === value.id} getOptionLabel={(group) => `${group.name}${group.status !== "ACTIVE" ? " — inactive" : ""}`} onChange={(_, value) => setVisibilityGroups(value)} renderInput={(params) => <TextField {...params} label="Visible to groups" placeholder="Select groups" />} noOptionsText="No matching active groups" />
              {!visibilityUsers.length && !visibilityGroups.length && <Typography color="error" role="status" sx={{ fontSize: 13 }}>Select at least one user or group.</Typography>}
            </>}
            {fieldErrors.visibility && <Typography color="error" role="alert">{fieldErrors.visibility}</Typography>}
            {documentType && <Alert severity="warning">Saving visibility settings applies to all existing and future documents of this type. Removed recipients lose access, including access to pending workflow tasks.</Alert>}
          </Stack>
        </Box>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}><Box><Typography sx={{ fontSize: 16, fontWeight: 750 }}>Metadata fields</Typography><Typography sx={{ color: "text.secondary", fontSize: 12 }}>The displayed order is also the upload-form order.</Typography></Box><Button onClick={() => setFields((current) => [...current, blankField()])} disabled={saving}>Add field</Button></Stack>
        {!fields.length && <Paper elevation={0} sx={{ border: "1px dashed #cbd5e1", p: 2 }}><Typography color="text.secondary" sx={{ fontSize: 13 }}>This type has no metadata fields yet.</Typography></Paper>}
        {fields.map((field, index) => <Paper elevation={0} key={field.id ?? `new-${index}`} sx={{ border: "1px solid #e2e8f0", borderRadius: 1, p: 2 }}><Stack spacing={1.5}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
            <Chip label={`Field ${index + 1}`} size="small" />
            <TextField required fullWidth size="small" label="Field label" value={field.label} disabled={saving} onChange={(event) => updateField(index, { label: event.target.value })} slotProps={{ htmlInput: { maxLength: 160 } }} />
            <TextField select size="small" label="Field type" value={field.kind} disabled={saving} sx={{ minWidth: 170 }} onChange={(event) => updateField(index, { kind: event.target.value as MetadataFieldKind, options: event.target.value === "SINGLE_SELECT" ? field.options : [] })}>{fieldKinds.map((kind) => <MenuItem key={kind.value} value={kind.value}>{kind.label}</MenuItem>)}</TextField>
            <Button aria-label={`Move ${field.label || `field ${index + 1}`} up`} disabled={saving || index === 0} onClick={() => moveField(index, -1)}><ArrowUpwardRounded /></Button>
            <Button aria-label={`Move ${field.label || `field ${index + 1}`} down`} disabled={saving || index === fields.length - 1} onClick={() => moveField(index, 1)}><ArrowDownwardRounded /></Button>
            <Button color="error" aria-label={`Remove ${field.label || `field ${index + 1}`}`} disabled={saving} onClick={() => setFields((current) => current.filter((_, fieldIndex) => fieldIndex !== index))}><DeleteOutlineRounded /></Button>
          </Stack>
          <TextField fullWidth size="small" label="Help text" value={field.helpText ?? ""} disabled={saving} slotProps={{ htmlInput: { maxLength: 500 } }} onChange={(event) => updateField(index, { helpText: event.target.value })} />
          {field.kind === "SINGLE_SELECT" && <TextField required fullWidth size="small" label="Choices" value={field.options.join(", ")} disabled={saving} helperText="Enter 2–20 unique choices separated by commas." onChange={(event) => updateField(index, { options: event.target.value.split(",") })} />}
          <FormControlLabel control={<Checkbox checked={field.isRequired} disabled={saving} onChange={(event) => updateField(index, { isRequired: event.target.checked })} />} label="Required when uploading a document of this type" />
        </Stack></Paper>)}
      </Stack></DialogContent>
      <DialogActions sx={{ p: 2.5 }}><Button disabled={saving} onClick={onClose}>Cancel</Button><Button type="submit" variant="contained" disabled={saving || !name.trim() || (restricted && !visibilityUsers.length && !visibilityGroups.length)}>{saving ? "Saving…" : documentType ? "Save changes" : "Create document type"}</Button></DialogActions>
    </form>
  </Dialog>;
}

export function DocumentTypesPage({ currentUser, onSignOut }: { currentUser: AuthenticatedUser; onSignOut: () => void }) {
  const canRead = currentUser.permissions.includes("admin.document-types.read");
  const canCreate = currentUser.permissions.includes("admin.document-types.create");
  const canUpdate = currentUser.permissions.includes("admin.document-types.update");
  const canArchive = currentUser.permissions.includes("admin.document-types.archive");
  const [pagination, setPagination] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<MRT_SortingState>([{ id: "updatedAt", desc: true }]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<DocumentTypesResult | null>(null);
  const [loading, setLoading] = useState(canRead);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [editing, setEditing] = useState<ManagedDocumentType | null | undefined>();
  const [archiving, setArchiving] = useState<ManagedDocumentType | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!canRead) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true); setError("");
      const sort = sorting[0];
      listDocumentTypes({ page: String(pagination.pageIndex + 1), pageSize: String(pagination.pageSize), search, sortBy: sort?.id ?? "updatedAt", sortOrder: sort?.desc === false ? "asc" : "desc", ...(status ? { status } : {}) }, controller.signal)
        .then((response) => { if (!controller.signal.aborted) setResult(response); })
        .catch((requestError: unknown) => { if (controller.signal.aborted) return; setError(errorMessage(requestError)); setResult(null); if (requestError instanceof DocumentTypesRequestError && requestError.status === 401) onSignOut(); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [canRead, pagination, sorting, search, status, refresh, onSignOut]);

  const columns = useMemo<MRT_ColumnDef<ManagedDocumentType>[]>(() => [
    { accessorKey: "name", header: "Document type", Cell: ({ row }) => <Box><Typography sx={{ fontSize: 13, fontWeight: 700 }}>{row.original.name}</Typography><Typography sx={{ color: "text.secondary", fontSize: 11 }}>{row.original.description || "No description"}</Typography></Box> },
    { id: "fields", header: "Metadata fields", enableSorting: false, Cell: ({ row }) => row.original.fields.length },
    { id: "visibility", header: "Visibility", enableSorting: false, Cell: ({ row }) => <Chip size="small" color={row.original.visibilityRestricted ? "warning" : "default"} label={row.original.visibilityRestricted ? "Selected users/groups" : "Existing access"} /> },
    { id: "documents", header: "Documents", enableSorting: false, Cell: ({ row }) => row.original._count.documents },
    { accessorKey: "updatedAt", header: "Last updated", Cell: ({ row }) => new Date(row.original.updatedAt).toLocaleString() },
    { accessorKey: "status", header: "Status", Cell: ({ row }) => <Chip size="small" color={row.original.status === "ACTIVE" ? "success" : "default"} label={row.original.status === "ACTIVE" ? "Active" : "Archived"} /> },
    { id: "actions", header: "Actions", enableSorting: false, Cell: ({ row }) => row.original.status === "ACTIVE" && <Stack direction="row">{canUpdate && <Button onClick={() => setEditing(row.original)}>Edit</Button>}{canArchive && <Button color="warning" onClick={() => setArchiving(row.original)}>Archive</Button>}</Stack> },
  ], [canUpdate, canArchive]);

  async function confirmArchive() {
    if (!archiving || saving) return;
    setSaving(true); setError("");
    try { await archiveDocumentType(archiving.id); setArchiving(null); setNotice("Document type archived. Existing document metadata was retained."); setRefresh((value) => value + 1); }
    catch (requestError) { setError(errorMessage(requestError)); if (requestError instanceof DocumentTypesRequestError && requestError.status === 401) onSignOut(); }
    finally { setSaving(false); }
  }

  return <Stack spacing={3}>
    <PageHeader title="Document types" description="Configure document visibility and reusable metadata fields." action={canCreate ? { label: "Create document type", icon: <DescriptionOutlined />, onClick: () => setEditing(null) } : undefined} />
    {notice && <Alert severity="success" onClose={() => setNotice("")}>{notice}</Alert>}
    {!canRead ? <Alert severity="info">You do not have permission to view document types.</Alert> : <>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}><TextField fullWidth label="Search document types" value={search} onChange={(event) => { setSearch(event.target.value); setPagination((current) => ({ ...current, pageIndex: 0 })); }} /><TextField select label="Status" value={status} sx={{ minWidth: 180 }} onChange={(event) => { setStatus(event.target.value); setPagination((current) => ({ ...current, pageIndex: 0 })); }}><MenuItem value="">All statuses</MenuItem><MenuItem value="ACTIVE">Active</MenuItem><MenuItem value="ARCHIVED">Archived</MenuItem></TextField><Button disabled={loading} onClick={() => setRefresh((value) => value + 1)}>Refresh</Button></Stack>
      {error && <Alert severity="error" action={<Button onClick={() => setRefresh((value) => value + 1)}>Retry</Button>}>{error}</Alert>}
      <SaileAdminTable columns={columns} data={result?.data ?? []} getRowId={(row) => row.id} isLoading={loading} pagination={pagination} onPaginationChange={setPagination} sorting={sorting} onSortingChange={(updater) => { setSorting(updater); setPagination((current) => ({ ...current, pageIndex: 0 })); }} rowCount={result?.meta.total ?? 0} />
      {!loading && !error && result?.meta.total === 0 && <Typography role="status">No document types match these filters.</Typography>}
    </>}
    {editing !== undefined && <DocumentTypeForm documentType={editing} onClose={() => setEditing(undefined)} onSignOut={onSignOut} onSaved={() => { setNotice(editing ? "Document type updated." : "Document type created."); setEditing(undefined); setRefresh((value) => value + 1); }} />}
    <Dialog open={!!archiving} onClose={() => { if (!saving) setArchiving(null); }} aria-labelledby="archive-document-type-title"><DialogTitle id="archive-document-type-title">Archive document type?</DialogTitle><DialogContent><Typography>“{archiving?.name}” will no longer be available for new uploads. Existing documents and metadata values will be retained.</Typography></DialogContent><DialogActions><Button disabled={saving} onClick={() => setArchiving(null)}>Cancel</Button><Button color="warning" variant="contained" disabled={saving} onClick={confirmArchive}>{saving ? "Archiving…" : "Archive document type"}</Button></DialogActions></Dialog>
  </Stack>;
}
