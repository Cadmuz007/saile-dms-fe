"use client";

import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import CheckCircleOutlineRounded from "@mui/icons-material/CheckCircleOutlineRounded";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import GroupOutlined from "@mui/icons-material/GroupOutlined";
import PersonOutlineRounded from "@mui/icons-material/PersonOutlineRounded";
import StorageOutlined from "@mui/icons-material/StorageOutlined";
import TimerOutlined from "@mui/icons-material/TimerOutlined";
import VpnKeyOutlined from "@mui/icons-material/VpnKeyOutlined";
import { Alert, Box, Button, Divider, Paper, Stack, Typography } from "@mui/material";
import type { MRT_ColumnDef, MRT_PaginationState, MRT_SortingState } from "material-react-table";
import { useMemo, useState } from "react";

import { approvalAlerts } from "../mock-data";
import type { AdminView, ApprovalAlert } from "../types";
import { AuthenticationPage, GroupsPage, LicensingPage, PermissionsPage, UsersPage } from "./access-management";
import { MetricCard, PageHeader, StatusChip } from "./admin-page-primitives";
import { DocumentTypesPage, SetSailAiPage, SetSailPage } from "./document-workflow-management";
import { PoliciesPage, SlaPage } from "./governance-management";
import { SaileAdminTable } from "./saile-admin-table";

interface AdminContentProps { activeView: AdminView; }

function useTableState() {
  const [pagination, setPagination] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  return { pagination, setPagination, setSorting, sorting };
}

function Overview() {
  const { pagination, setPagination, setSorting, sorting } = useTableState();
  const columns = useMemo<MRT_ColumnDef<ApprovalAlert>[]>(() => [
    { accessorKey: "document", header: "Document", size: 300 },
    { accessorKey: "assignedTo", header: "Assigned user" },
    { accessorKey: "stage", header: "Set Sail stage" },
    { accessorKey: "waiting", header: "Awaiting action" },
    { accessorKey: "sla", header: "SLA status", Cell: ({ cell }) => <StatusChip label={cell.getValue<ApprovalAlert["sla"]>()} /> },
    { id: "action", header: "", Cell: () => <Button endIcon={<ArrowOutwardRounded fontSize="small" />} size="small">View</Button> },
  ], []);
  return <Stack spacing={3}><PageHeader action={{ label: "Create user" }} description="Monitor access, storage, document activity, and approval response performance across Saile." title="Administration overview" /><Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(5, 1fr)" } }}><MetricCard detail="78% of organization capacity" icon={<VpnKeyOutlined />} label="Enabled licenses" value="188 / 240" /><MetricCard color="#2563eb" detail="12 added this month" icon={<PersonOutlineRounded />} label="Active users" value="164" /><MetricCard color="#0891b2" detail="Across 6 departments" icon={<GroupOutlined />} label="Groups" value="18" /><MetricCard color="#c2410c" detail="Across Home, Private, and Public" icon={<FolderOutlined />} label="Folders" value="842" /><MetricCard color="#059669" detail="6.4 TB of 12 TB used" icon={<StorageOutlined />} label="Documents" value="28,461" /></Box><Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", xl: "1.45fr .85fr" } }}><Paper elevation={0} sx={{ borderRadius: 1, p: 2.5 }}><Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}><Box><Typography sx={{ fontSize: 16, fontWeight: 700 }}>Approval response watchlist</Typography><Typography sx={{ color: "text.secondary", fontSize: 12, mt: .35 }}>Users needing attention under the configured SLA.</Typography></Box><Button size="small" startIcon={<TimerOutlined />}>Manage SLA</Button></Stack><Box sx={{ mt: 2 }}><SaileAdminTable columns={columns} data={approvalAlerts} getRowId={(row) => row.id} onPaginationChange={setPagination} onSortingChange={setSorting} pagination={pagination} rowCount={approvalAlerts.length} sorting={sorting} /></Box></Paper><Paper elevation={0} sx={{ borderRadius: 1, p: 2.5 }}><Typography sx={{ fontSize: 16, fontWeight: 700 }}>Storage insights</Typography><Typography sx={{ color: "text.secondary", fontSize: 12, mt: .35 }}>Heavy file sizes per folder</Typography><Stack divider={<Divider flexItem />} spacing={0} sx={{ mt: 1.4 }}>{[["Procurement", "1.8 TB", "#810a6a"], ["Records Office", "1.4 TB", "#2563eb"], ["Finance", "932 GB", "#0891b2"]].map(([name, size, color]) => <Stack direction="row" key={name} sx={{ alignItems: "center", justifyContent: "space-between", py: 1.3 }}><Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><Box sx={{ bgcolor: `${color}12`, borderRadius: .75, color, display: "grid", height: 30, placeItems: "center", width: 30 }}><FolderOutlined fontSize="small" /></Box><Typography sx={{ fontSize: 13, fontWeight: 700 }}>{name}</Typography></Stack><Typography sx={{ color: "text.secondary", fontSize: 12 }}>{size}</Typography></Stack>)}</Stack><Alert icon={<CheckCircleOutlineRounded fontSize="inherit" />} severity="success" sx={{ borderRadius: 1, fontSize: 12, mt: 2 }}>All storage quotas are within policy.</Alert></Paper></Box><Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" } }}><Paper elevation={0} sx={{ borderRadius: 1, p: 2.5 }}><Typography sx={{ fontSize: 16, fontWeight: 700 }}>Storage per user</Typography><Typography sx={{ color: "text.secondary", fontSize: 12, mt: .35 }}>Highest allocation usage</Typography><Stack spacing={1.25} sx={{ mt: 2 }}>{[["Alex Rivera", "68%"], ["Maya Santos", "42%"], ["Angela Cruz", "36%"]].map(([name, usage]) => <Box key={name}><Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>{name}</Typography><Typography sx={{ color: "text.secondary", fontSize: 12 }}>{usage} of quota</Typography></Stack><Box sx={{ bgcolor: "#e2e8f0", height: 6, mt: .65 }}><Box sx={{ bgcolor: "#810a6a", height: 6, width: usage }} /></Box></Box>)}</Stack></Paper><Paper elevation={0} sx={{ borderRadius: 1, p: 2.5 }}><Typography sx={{ fontSize: 16, fontWeight: 700 }}>Most used classified document</Typography><Typography sx={{ color: "text.secondary", fontSize: 12, mt: .35 }}>This month’s upload volume</Typography><Typography sx={{ color: "#810a6a", fontSize: 23, fontWeight: 800, mt: 2 }}>Procurement Request</Typography><Typography sx={{ color: "text.secondary", fontSize: 12, mt: .4 }}>1,842 classified documents uploaded</Typography><Button size="small" sx={{ mt: 1.25 }}>Manage document types</Button></Paper></Box></Stack>;
}

export function AdminContent({ activeView }: AdminContentProps) {
  const mainSx = { p: { xs: 2, md: 3.5 } };
  if (activeView === "overview") return <Box component="main" sx={mainSx}><Overview /></Box>;
  if (activeView === "licenses") return <Box component="main" sx={mainSx}><LicensingPage /></Box>;
  if (activeView === "authentication") return <Box component="main" sx={mainSx}><AuthenticationPage /></Box>;
  if (activeView === "users") return <Box component="main" sx={mainSx}><UsersPage /></Box>;
  if (activeView === "groups") return <Box component="main" sx={mainSx}><GroupsPage /></Box>;
  if (activeView === "permissions") return <Box component="main" sx={mainSx}><PermissionsPage /></Box>;
  if (activeView === "policies") return <Box component="main" sx={mainSx}><PoliciesPage /></Box>;
  if (activeView === "sla") return <Box component="main" sx={mainSx}><SlaPage /></Box>;
  if (activeView === "document-types") return <Box component="main" sx={mainSx}><DocumentTypesPage /></Box>;
  if (activeView === "set-sail") return <Box component="main" sx={mainSx}><SetSailPage /></Box>;
  return <Box component="main" sx={mainSx}><SetSailAiPage /></Box>;
}
