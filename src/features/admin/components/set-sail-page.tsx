"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import ArrowDownwardRounded from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRounded from "@mui/icons-material/ArrowUpwardRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import PublishOutlined from "@mui/icons-material/PublishOutlined";
import SailingOutlined from "@mui/icons-material/SailingOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import type { MRT_ColumnDef, MRT_PaginationState, MRT_SortingState } from "material-react-table";
import { useEffect, useMemo, useState } from "react";

import type { AuthenticatedUser } from "@/features/auth/types";
import { listWorkflowDocumentTypeCandidates } from "@/services/workflow-templates";
import {
  archiveWorkflowTemplate,
  createWorkflowTemplate,
  listWorkflowRecipientCandidates,
  listWorkflowTemplates,
  publishWorkflowTemplate,
  updateWorkflowTemplate,
  WorkflowTemplatesRequestError,
} from "@/services/workflow-templates";
import type {
  ManagedWorkflowTemplate,
  WorkflowApprovedAction,
  WorkflowDecisionRule,
  WorkflowDocumentTransform,
  WorkflowRecipientCandidates,
  WorkflowRecipientInput,
  WorkflowRejectedAction,
  WorkflowStageInput,
  WorkflowTemplateInput,
  WorkflowTemplatesResult,
} from "../workflow-templates.types";
import { PageHeader } from "./admin-page-primitives";
import { SaileAdminTable } from "./saile-admin-table";

interface CandidateOption {
  key: string;
  label: string;
  targetType: "USER" | "GROUP";
  targetId: string;
}

const approvedActions: Array<{ value: WorkflowApprovedAction; label: string }> = [
  { value: "NEXT_STAGE", label: "Move to the next level" },
  { value: "LAST_STAGE", label: "Move to the last level" },
  { value: "APPROVE_DOCUMENT", label: "Approve the document" },
];
const rejectedActions: Array<{ value: WorkflowRejectedAction; label: string }> = [
  { value: "PREVIOUS_STAGE", label: "Go back to the previous level" },
  { value: "FIRST_STAGE", label: "Go back to the first level" },
  { value: "CANCEL_DOCUMENT", label: "Cancel the document" },
];
const documentTransforms: Array<{ value: WorkflowDocumentTransform; label: string }> = [
  { value: "CONVERT_TO_PDF", label: "Convert Document to PDF" },
  { value: "CONVERT_TO_PDF_AND_MOVE", label: "Convert Document to PDF and Move to…" },
  { value: "CONVERT_TO_PDF_AND_ASSIGN", label: "Convert Document to PDF and Assign to…" },
  { value: "MOVE_DOCUMENT", label: "Move Document to…" },
  { value: "DUPLICATE_AND_MOVE", label: "Duplicate Document and Move to…" },
];

const blankStage = (position: number): WorkflowStageInput => ({
  name: `Stage ${position + 1}`,
  decisionRule: "ANY",
  approvedAction: "APPROVE_DOCUMENT",
  rejectedAction: position === 0 ? "CANCEL_DOCUMENT" : "PREVIOUS_STAGE",
  documentTransform: "MOVE_DOCUMENT",
  recipients: [],
});
const errorMessage = (error: unknown) => error instanceof Error ? error.message : "The request could not be completed.";
const recipientKey = (recipient: WorkflowRecipientInput) => `${recipient.targetType}:${recipient.targetId}`;

function templateStages(template: ManagedWorkflowTemplate | null): WorkflowStageInput[] {
  if (!template) return [blankStage(0)];
  return template.stages.map((stage) => ({
    name: stage.name,
    decisionRule: stage.decisionRule,
    approvedAction: stage.approvedAction,
    rejectedAction: stage.rejectedAction,
    documentTransform: stage.documentTransform,
    recipients: stage.recipients.map((recipient) => recipient.userId
      ? { targetType: "USER", targetId: recipient.userId }
      : { targetType: "GROUP", targetId: recipient.groupId! }),
  }));
}

function optionsFromCandidates(candidates: WorkflowRecipientCandidates | null): CandidateOption[] {
  if (!candidates) return [];
  return [
    ...candidates.users.map((user) => ({
      key: `USER:${user.id}`,
      label: `${user.firstName} ${user.lastName} — ${user.email}`,
      targetType: "USER" as const,
      targetId: user.id,
    })),
    ...candidates.groups.map((group) => ({
      key: `GROUP:${group.id}`,
      label: `${group.name} (group)`,
      targetType: "GROUP" as const,
      targetId: group.id,
    })),
  ];
}

function existingOptions(template: ManagedWorkflowTemplate | null): CandidateOption[] {
  if (!template) return [];
  return template.stages.flatMap((stage) => stage.recipients.map((recipient) => recipient.user
    ? {
      key: `USER:${recipient.user.id}`,
      label: `${recipient.user.firstName} ${recipient.user.lastName} — ${recipient.user.email}`,
      targetType: "USER" as const,
      targetId: recipient.user.id,
    }
    : {
      key: `GROUP:${recipient.group!.id}`,
      label: `${recipient.group!.name} (group)`,
      targetType: "GROUP" as const,
      targetId: recipient.group!.id,
    }));
}

function WorkflowTemplateForm({ template, onClose, onSaved, onSignOut }: {
  template: ManagedWorkflowTemplate | null;
  onClose: () => void;
  onSaved: () => void;
  onSignOut: () => void;
}) {
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [stages, setStages] = useState<WorkflowStageInput[]>(templateStages(template));
  const [candidates, setCandidates] = useState<WorkflowRecipientCandidates | null>(null);
  const [candidateError, setCandidateError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    listWorkflowRecipientCandidates(controller.signal)
      .then((result) => { if (!controller.signal.aborted) setCandidates(result); })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        setCandidateError(errorMessage(requestError));
        if (requestError instanceof WorkflowTemplatesRequestError && requestError.status === 401) onSignOut();
      });
    return () => controller.abort();
  }, [onSignOut]);

  const options = useMemo(() => {
    const merged = new Map<string, CandidateOption>();
    for (const option of [...existingOptions(template), ...optionsFromCandidates(candidates)]) merged.set(option.key, option);
    return [...merged.values()];
  }, [candidates, template]);
  const optionsByKey = useMemo(() => new Map(options.map((option) => [option.key, option])), [options]);

  function updateStage(index: number, next: Partial<WorkflowStageInput>) {
    setStages((current) => current.map((stage, stageIndex) => stageIndex === index ? { ...stage, ...next } : stage));
  }

  function moveStage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= stages.length) return;
    setStages((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function changeRecipients(index: number, event: SelectChangeEvent<string[]>) {
    const keys = typeof event.target.value === "string" ? event.target.value.split(",") : event.target.value;
    updateStage(index, {
      recipients: keys.flatMap((key) => {
        const option = optionsByKey.get(key);
        return option ? [{ targetType: option.targetType, targetId: option.targetId }] : [];
      }),
    });
  }

  const valid = name.trim().length > 0
    && stages.length > 0
    && stages.every((stage, index) => stage.name.trim().length > 0
      && stage.recipients.length > 0
      && (stage.approvedAction !== "APPROVE_DOCUMENT" || (index === stages.length - 1 && Boolean(stage.documentTransform)))
      && (index !== 0 || stage.rejectedAction !== "PREVIOUS_STAGE")
      && (index !== stages.length - 1 || (stage.approvedAction !== "NEXT_STAGE" && stage.approvedAction !== "LAST_STAGE")));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving || !valid) return;
    setSaving(true);
    setError("");
    const input: WorkflowTemplateInput = {
      name: name.trim(),
      description: description.trim() || null,
      stages: stages.map((stage) => ({ ...stage, name: stage.name.trim() })),
    };
    try {
      if (template) await updateWorkflowTemplate(template.id, template.configurationRevision, input);
      else await createWorkflowTemplate(input);
      onSaved();
    } catch (requestError) {
      setError(errorMessage(requestError));
      if (requestError instanceof WorkflowTemplatesRequestError && requestError.status === 401) onSignOut();
    } finally {
      setSaving(false);
    }
  }

  return <Dialog open fullWidth maxWidth="md" onClose={() => { if (!saving) onClose(); }} aria-labelledby="set-sail-form-title">
    <form onSubmit={submit}>
      <DialogTitle id="set-sail-form-title">{template ? "Edit Set Sail draft" : "Create Set Sail draft"}</DialogTitle>
      <DialogContent><Stack spacing={2.5} sx={{ pt: 1 }}>
        {error && <Alert severity="error">{error}</Alert>}
        {candidateError && <Alert severity="error">{candidateError}</Alert>}
        <Alert severity="info">Save the draft before publishing it. Publishing creates an immutable configuration used by live workflow execution.</Alert>
        <TextField autoFocus required fullWidth label="Name of Set Sail" value={name} disabled={saving} slotProps={{ htmlInput: { maxLength: 160 } }} onChange={(event) => setName(event.target.value)} />
        <TextField fullWidth multiline minRows={2} label="Description" value={description} disabled={saving} slotProps={{ htmlInput: { maxLength: 1000 } }} onChange={(event) => setDescription(event.target.value)} />
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Box><Typography sx={{ fontSize: 16, fontWeight: 750 }}>Sequential stages</Typography><Typography sx={{ color: "text.secondary", fontSize: 12 }}>Stage order and every revision are retained in the audit history.</Typography></Box>
          <Button startIcon={<AddRounded />} disabled={saving || stages.length >= 30} onClick={() => setStages((current) => [
            ...current.map((stage, index) => index === current.length - 1 && stage.approvedAction === "APPROVE_DOCUMENT" ? { ...stage, approvedAction: "NEXT_STAGE" as const, documentTransform: null } : stage),
            blankStage(current.length),
          ])}>Add stage</Button>
        </Stack>
        {stages.map((stage, index) => <Paper key={index} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 1, p: 2 }}><Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
            <Chip label={`Stage ${index + 1}`} size="small" sx={{ bgcolor: "#fdf2f8", color: "#810a6a", fontWeight: 700 }} />
            <TextField required fullWidth size="small" label="Stage name" value={stage.name} disabled={saving} slotProps={{ htmlInput: { maxLength: 160 } }} onChange={(event) => updateStage(index, { name: event.target.value })} />
            <Button aria-label={`Move ${stage.name} up`} disabled={saving || index === 0} onClick={() => moveStage(index, -1)}><ArrowUpwardRounded /></Button>
            <Button aria-label={`Move ${stage.name} down`} disabled={saving || index === stages.length - 1} onClick={() => moveStage(index, 1)}><ArrowDownwardRounded /></Button>
            <Button color="error" aria-label={`Remove ${stage.name}`} disabled={saving || stages.length === 1} onClick={() => setStages((current) => current.filter((_, stageIndex) => stageIndex !== index))}><DeleteOutlineRounded /></Button>
          </Stack>
          <FormControl fullWidth required disabled={saving || !candidates}>
            <InputLabel id={`stage-${index}-recipients-label`}>Recipients</InputLabel>
            <Select<string[]>
              multiple
              labelId={`stage-${index}-recipients-label`}
              value={stage.recipients.map(recipientKey)}
              onChange={(event) => changeRecipients(index, event)}
              input={<OutlinedInput label="Recipients" />}
              renderValue={(selected) => <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: "wrap" }}>{selected.map((key) => <Chip key={key} size="small" label={optionsByKey.get(key)?.label ?? key} />)}</Stack>}
            >
              {options.map((option) => <MenuItem key={option.key} value={option.key}>{option.label}</MenuItem>)}
            </Select>
          </FormControl>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" } }}>
            <TextField select label="Decision making" value={stage.decisionRule} disabled={saving} onChange={(event) => updateStage(index, { decisionRule: event.target.value as WorkflowDecisionRule })}>
              <MenuItem value="ANY">OR — one recipient decides</MenuItem>
              <MenuItem value="ALL">AND — all recipients decide</MenuItem>
            </TextField>
            <TextField select label="Condition if approved" value={stage.approvedAction} disabled={saving} error={(index === stages.length - 1 && (stage.approvedAction === "NEXT_STAGE" || stage.approvedAction === "LAST_STAGE")) || (index !== stages.length - 1 && stage.approvedAction === "APPROVE_DOCUMENT")} helperText={index === stages.length - 1 && stage.approvedAction === "NEXT_STAGE" ? "The final stage cannot move to the next level." : index === stages.length - 1 && stage.approvedAction === "LAST_STAGE" ? "The final stage cannot move to itself as the last level." : index !== stages.length - 1 && stage.approvedAction === "APPROVE_DOCUMENT" ? "Approve the document is available only on the final stage." : undefined} onChange={(event) => { const approvedAction = event.target.value as WorkflowApprovedAction; updateStage(index, { approvedAction, documentTransform: approvedAction === "APPROVE_DOCUMENT" ? stage.documentTransform : null }); }}>
              {approvedActions.map((action) => <MenuItem disabled={(index === stages.length - 1 && (action.value === "NEXT_STAGE" || action.value === "LAST_STAGE")) || (index !== stages.length - 1 && action.value === "APPROVE_DOCUMENT")} key={action.value} value={action.value}>{action.label}</MenuItem>)}
            </TextField>
            <TextField select label="Condition if rejected" value={stage.rejectedAction} disabled={saving} error={index === 0 && stage.rejectedAction === "PREVIOUS_STAGE"} helperText={index === 0 && stage.rejectedAction === "PREVIOUS_STAGE" ? "The first stage has no previous level." : undefined} onChange={(event) => updateStage(index, { rejectedAction: event.target.value as WorkflowRejectedAction })}>
              {rejectedActions.map((action) => <MenuItem disabled={index === 0 && action.value === "PREVIOUS_STAGE"} key={action.value} value={action.value}>{action.label}</MenuItem>)}
            </TextField>
          </Box>
          {index === stages.length - 1 && stage.approvedAction === "APPROVE_DOCUMENT" ? <TextField required select fullWidth label="Transform Document" value={stage.documentTransform ?? ""} disabled={saving} onChange={(event) => updateStage(index, { documentTransform: event.target.value as WorkflowDocumentTransform })}>
            {documentTransforms.map((transform) => <MenuItem key={transform.value} value={transform.value}>{transform.label}</MenuItem>)}
          </TextField> : null}
        </Stack></Paper>)}
      </Stack></DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button disabled={saving} onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={saving || !valid || !candidates}>{saving ? "Saving…" : template ? "Save revision" : "Create draft"}</Button>
      </DialogActions>
    </form>
  </Dialog>;
}

function PublishWorkflowDialog({ template, onClose, onPublished, onSignOut }: {
  template: ManagedWorkflowTemplate;
  onClose: () => void;
  onPublished: () => void;
  onSignOut: () => void;
}) {
  const [documentTypes, setDocumentTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    listWorkflowDocumentTypeCandidates(controller.signal)
      .then((types) => { if (!controller.signal.aborted) setDocumentTypes(types); })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        setError(errorMessage(requestError));
        if (requestError instanceof WorkflowTemplatesRequestError && requestError.status === 401) onSignOut();
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [onSignOut]);

  async function confirmPublish() {
    if (publishing || loading) return;
    setPublishing(true);
    setError("");
    try {
      await publishWorkflowTemplate(template.id, template.configurationRevision, selectedIds);
      onPublished();
    } catch (requestError) {
      setError(errorMessage(requestError));
      if (requestError instanceof WorkflowTemplatesRequestError && requestError.status === 401) onSignOut();
    } finally {
      setPublishing(false);
    }
  }

  return <Dialog open fullWidth maxWidth="sm" onClose={() => { if (!publishing) onClose(); }} aria-labelledby="publish-set-sail-title">
    <DialogTitle id="publish-set-sail-title">Publish Set Sail workflow?</DialogTitle>
    <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
      {error && <Alert severity="error">{error}</Alert>}
      <Alert severity="warning">Revision {template.configurationRevision} will become immutable. Its stages, recipients, and document-type assignments remain available in the audit history.</Alert>
      <FormControl fullWidth disabled={loading || publishing}>
        <InputLabel id="publish-document-types-label">Assigned document types (optional)</InputLabel>
        <Select<string[]>
          multiple
          labelId="publish-document-types-label"
          value={selectedIds}
          onChange={(event) => setSelectedIds(typeof event.target.value === "string" ? event.target.value.split(",") : event.target.value)}
          input={<OutlinedInput label="Assigned document types (optional)" />}
          renderValue={(selected) => selected.length === 0 ? "No document types" : <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: "wrap" }}>{selected.map((id) => <Chip key={id} size="small" label={documentTypes.find((type) => type.id === id)?.name ?? id} />)}</Stack>}
        >
          {documentTypes.map((type) => <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>)}
        </Select>
      </FormControl>
      <Typography sx={{ color: "text.secondary", fontSize: 12 }}>Publishing makes the template selectable by its assigned document types. Starting a workflow from a document is not enabled yet.</Typography>
    </Stack></DialogContent>
    <DialogActions><Button disabled={publishing} onClick={onClose}>Cancel</Button><Button variant="contained" startIcon={<PublishOutlined />} disabled={publishing || loading || Boolean(error)} onClick={confirmPublish}>{publishing ? "Publishing…" : "Publish"}</Button></DialogActions>
  </Dialog>;
}

export function SetSailPage({ currentUser, onSignOut }: { currentUser: AuthenticatedUser; onSignOut: () => void }) {
  const canRead = currentUser.permissions.includes("admin.workflows.read");
  const canCreate = currentUser.permissions.includes("admin.workflows.create");
  const canUpdate = currentUser.permissions.includes("admin.workflows.update");
  const canPublish = currentUser.permissions.includes("admin.workflows.publish");
  const canArchive = currentUser.permissions.includes("admin.workflows.archive");
  const [pagination, setPagination] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<MRT_SortingState>([{ id: "updatedAt", desc: true }]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<WorkflowTemplatesResult | null>(null);
  const [loading, setLoading] = useState(canRead);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [editing, setEditing] = useState<ManagedWorkflowTemplate | null | undefined>();
  const [publishing, setPublishing] = useState<ManagedWorkflowTemplate | null>(null);
  const [archiving, setArchiving] = useState<ManagedWorkflowTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!canRead) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      const sort = sorting[0];
      listWorkflowTemplates({
        page: String(pagination.pageIndex + 1),
        pageSize: String(pagination.pageSize),
        search,
        sortBy: sort?.id ?? "updatedAt",
        sortOrder: sort?.desc === false ? "asc" : "desc",
        ...(status ? { status } : {}),
      }, controller.signal)
        .then((response) => { if (!controller.signal.aborted) setResult(response); })
        .catch((requestError: unknown) => {
          if (controller.signal.aborted) return;
          setError(errorMessage(requestError));
          setResult(null);
          if (requestError instanceof WorkflowTemplatesRequestError && requestError.status === 401) onSignOut();
        })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [canRead, pagination, sorting, search, status, refresh, onSignOut]);

  const columns = useMemo<MRT_ColumnDef<ManagedWorkflowTemplate>[]>(() => [
    { accessorKey: "name", header: "Set Sail workflow", Cell: ({ row }) => <Box><Typography sx={{ fontSize: 13, fontWeight: 700 }}>{row.original.name}</Typography><Typography sx={{ color: "text.secondary", fontSize: 11 }}>{row.original.description || "No description"}</Typography></Box> },
    { id: "stages", header: "Stages", enableSorting: false, Cell: ({ row }) => row.original.stages.length },
    { id: "recipients", header: "Recipients", enableSorting: false, Cell: ({ row }) => new Set(row.original.stages.flatMap((stage) => stage.recipients.map((recipient) => recipient.userId ?? recipient.groupId))).size },
    { id: "documentTypes", header: "Document types", enableSorting: false, Cell: ({ row }) => row.original.documentTypes.length > 0 ? row.original.documentTypes.map((assignment) => assignment.documentType.name).join(", ") : "—" },
    { accessorKey: "configurationRevision", header: "Revision", enableSorting: false },
    { accessorKey: "updatedAt", header: "Last updated", Cell: ({ row }) => new Date(row.original.updatedAt).toLocaleString() },
    { accessorKey: "status", header: "Status", Cell: ({ row }) => <Chip size="small" color={row.original.status === "DRAFT" ? "info" : row.original.status === "PUBLISHED" ? "success" : "default"} label={row.original.status === "DRAFT" ? "Draft" : row.original.status === "PUBLISHED" ? "Published" : "Archived"} /> },
    { id: "actions", header: "Actions", enableSorting: false, Cell: ({ row }) => row.original.status !== "ARCHIVED" && <Stack direction="row">{row.original.status === "DRAFT" && canUpdate && <Button onClick={() => setEditing(row.original)}>Edit</Button>}{row.original.status === "DRAFT" && canPublish && <Button startIcon={<PublishOutlined />} onClick={() => setPublishing(row.original)}>Publish</Button>}{canArchive && <Button color="warning" onClick={() => setArchiving(row.original)}>Archive</Button>}</Stack> },
  ], [canArchive, canPublish, canUpdate]);

  async function confirmArchive() {
    if (!archiving || saving) return;
    setSaving(true);
    setError("");
    try {
      await archiveWorkflowTemplate(archiving.id);
      setArchiving(null);
      setNotice("Set Sail workflow archived. Its configuration revisions, assignments, and audit history were retained.");
      setRefresh((value) => value + 1);
    } catch (requestError) {
      setError(errorMessage(requestError));
      if (requestError instanceof WorkflowTemplatesRequestError && requestError.status === 401) onSignOut();
    } finally {
      setSaving(false);
    }
  }

  if (!canRead) return <Alert severity="warning">You do not have permission to view Set Sail workflow templates.</Alert>;

  return <Stack spacing={3}>
    <PageHeader title="Set Sail" description="Create, revise, and immutably publish sequential workflow templates for selected document types." action={canCreate ? { label: "Create Set Sail draft", icon: <SailingOutlined />, onClick: () => setEditing(null) } : undefined} />
    <Alert severity="info">Draft management, immutable publishing, and optional document-type assignment are live. Workflow execution remains disabled until approval-transition rules are confirmed.</Alert>
    {notice && <Alert severity="success" onClose={() => setNotice("")}>{notice}</Alert>}
    {error && <Alert severity="error">{error}</Alert>}
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
      <TextField label="Search Set Sail workflows" size="small" value={search} onChange={(event) => { setSearch(event.target.value); setPagination((current) => ({ ...current, pageIndex: 0 })); }} />
      <TextField select label="Status" size="small" value={status} sx={{ minWidth: 160 }} onChange={(event) => { setStatus(event.target.value); setPagination((current) => ({ ...current, pageIndex: 0 })); }}>
        <MenuItem value="">All</MenuItem><MenuItem value="DRAFT">Draft</MenuItem><MenuItem value="PUBLISHED">Published</MenuItem><MenuItem value="ARCHIVED">Archived</MenuItem>
      </TextField>
    </Stack>
    <SaileAdminTable
      columns={columns}
      data={result?.data ?? []}
      getRowId={(row) => row.id}
      isLoading={loading}
      onPaginationChange={setPagination}
      onSortingChange={setSorting}
      pagination={pagination}
      rowCount={result?.meta.total ?? 0}
      sorting={sorting}
    />
    {editing !== undefined && <WorkflowTemplateForm
      template={editing}
      onClose={() => setEditing(undefined)}
      onSaved={() => {
        setEditing(undefined);
        setNotice(editing ? "Set Sail draft revision saved." : "Set Sail draft created.");
        setRefresh((value) => value + 1);
      }}
      onSignOut={onSignOut}
    />}
    {publishing && <PublishWorkflowDialog
      template={publishing}
      onClose={() => setPublishing(null)}
      onPublished={() => {
        setPublishing(null);
        setNotice("Set Sail workflow published. Its configuration and document-type assignments are now immutable.");
        setRefresh((value) => value + 1);
      }}
      onSignOut={onSignOut}
    />}
    <Dialog open={archiving !== null} onClose={() => { if (!saving) setArchiving(null); }} aria-labelledby="archive-set-sail-title">
      <DialogTitle id="archive-set-sail-title">Archive Set Sail workflow?</DialogTitle>
      <DialogContent><Typography sx={{ pt: 1 }}>The workflow will no longer be active. Its stages, recipients, document-type assignments, revisions, and audit snapshots remain retained.</Typography></DialogContent>
      <DialogActions><Button disabled={saving} onClick={() => setArchiving(null)}>Cancel</Button><Button color="warning" variant="contained" disabled={saving} onClick={confirmArchive}>{saving ? "Archiving…" : "Archive workflow"}</Button></DialogActions>
    </Dialog>
  </Stack>;
}
