import AddRounded from "@mui/icons-material/AddRounded";
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

const statusColor = {
  Active: { backgroundColor: "#ecfdf5", color: "#047857" },
  Invited: { backgroundColor: "#eff6ff", color: "#1d4ed8" },
  Inactive: { backgroundColor: "#f1f5f9", color: "#475569" },
  Assigned: { backgroundColor: "#fdf2f8", color: "#9d174d" },
  Available: { backgroundColor: "#ecfdf5", color: "#047857" },
  "Expiring soon": { backgroundColor: "#fff7ed", color: "#c2410c" },
  Overdue: { backgroundColor: "#fff1f2", color: "#be123c" },
  "At risk": { backgroundColor: "#fff7ed", color: "#c2410c" },
  "On track": { backgroundColor: "#ecfdf5", color: "#047857" },
  Draft: { backgroundColor: "#f1f5f9", color: "#475569" },
  Published: { backgroundColor: "#ecfdf5", color: "#047857" },
} as const;

export type AdminStatus = keyof typeof statusColor;

export function StatusChip({ label }: { label: AdminStatus }) {
  return <Chip label={label} size="small" sx={{ ...statusColor[label], borderRadius: .75, fontSize: 11, fontWeight: 700, height: 24 }} />;
}

export function PageHeader({ title, description, action }: { title: string; description: string; action?: { label: string; icon?: ReactNode; onClick?: () => void; disabled?: boolean } }) {
  return <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} sx={{ alignItems: { sm: "flex-start" }, justifyContent: "space-between" }}><Box><Typography component="h1" sx={{ fontSize: { xs: 25, md: 29 }, fontWeight: 800, letterSpacing: "-.035em" }}>{title}</Typography><Typography sx={{ color: "text.secondary", fontSize: 14, mt: .5 }}>{description}</Typography></Box>{action ? <Button disableElevation disabled={action.disabled} onClick={action.onClick} startIcon={action.icon ?? <AddRounded />} sx={{ px: 2, py: 1, whiteSpace: "nowrap" }} variant="contained">{action.label}</Button> : null}</Stack>;
}

export function MetricCard({ icon, label, value, detail, color = "#810a6a" }: { icon: ReactNode; label: string; value: string; detail: string; color?: string }) {
  return <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 1 }}><CardContent sx={{ p: "18px !important" }}><Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}><Box><Typography sx={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: ".045em" }}>{label.toUpperCase()}</Typography><Typography sx={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.04em", mt: .5 }}>{value}</Typography></Box><Box sx={{ alignItems: "center", bgcolor: `${color}10`, borderRadius: .75, color, display: "flex", height: 38, justifyContent: "center", width: 38 }}>{icon}</Box></Stack><Typography sx={{ color: "#64748b", fontSize: 11.5, mt: 1.25 }}>{detail}</Typography></CardContent></Card>;
}
