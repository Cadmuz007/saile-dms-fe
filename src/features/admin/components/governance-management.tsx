"use client";

import ArchiveOutlined from "@mui/icons-material/ArchiveOutlined";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { Alert, Box, Checkbox, FormControl, FormControlLabel, FormGroup, InputLabel, MenuItem, Paper, Select, Stack, Switch, TextField, Typography } from "@mui/material";
import { useState } from "react";

import { PageHeader } from "./admin-page-primitives";

const fileTypes = ["jpeg", "png", "tif", "docx", "doc", "pdf", "xls", "ppt", "pptx"];

function SectionTitle({ title, description }: { title: string; description: string }) {
  return <Box><Typography sx={{ fontSize: 16, fontWeight: 750 }}>{title}</Typography><Typography sx={{ color: "text.secondary", fontSize: 12, mt: .35 }}>{description}</Typography></Box>;
}

export function PoliciesPage() {
  const [saved, setSaved] = useState(false);
  const [enabledTypes, setEnabledTypes] = useState(fileTypes);
  return <Stack spacing={3}><PageHeader action={{ label: "Save policy changes", icon: <SaveOutlined />, onClick: () => setSaved(true) }} description="Set the account, storage, upload, and reminder rules that apply across Saile DMS." title="Policies" />{saved ? <Alert onClose={() => setSaved(false)} severity="success" sx={{ borderRadius: 1 }}>Policy changes saved in the UI demo. Server-side enforcement is not connected yet.</Alert> : null}<Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" } }}><Paper elevation={0} sx={{ borderRadius: 1, p: 2.5 }}><Stack spacing={2.5}><SectionTitle description="Define sign-in timeout and temporary lockout behavior." title="Account protection" /><Stack direction={{ xs: "column", sm: "row" }} spacing={2}><TextField defaultValue="30" fullWidth label="Logout when inactive (minutes)" type="number" /><TextField defaultValue="3" fullWidth label="Incorrect password attempts" type="number" /></Stack><TextField defaultValue="15" fullWidth label="Temporary block duration (minutes)" type="number" /></Stack></Paper><Paper elevation={0} sx={{ borderRadius: 1, p: 2.5 }}><Stack spacing={2.5}><SectionTitle description="Define each user’s storage allocation and upload behavior." title="Storage controls" /><TextField defaultValue="5" fullWidth label="Default storage size per user (GB)" type="number" /><FormControlLabel control={<Switch defaultChecked />} label="Disable Upload Document when a user reaches 100% of storage" /><Alert icon={<ArchiveOutlined fontSize="inherit" />} severity="info" sx={{ borderRadius: 1, fontSize: 12.5 }}>Storage enforcement will be calculated by the backend once document storage is implemented.</Alert></Stack></Paper></Box><Paper elevation={0} sx={{ borderRadius: 1, p: 2.5 }}><Stack spacing={2.25}><SectionTitle description="Only the selected formats will be accepted when documents are uploaded." title="Enabled file types" /><FormGroup row sx={{ columnGap: 2.5, rowGap: .5 }}>{fileTypes.map((type) => <FormControlLabel control={<Checkbox checked={enabledTypes.includes(type)} onChange={() => setEnabledTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type])} />} key={type} label={type.toUpperCase()} />)}</FormGroup></Stack></Paper><Paper elevation={0} sx={{ borderRadius: 1, p: 2.5 }}><Stack direction={{ xs: "column", md: "row" }} spacing={2.5} sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}><SectionTitle description="This interval is available to users sending direct routed documents." title="Reminder notification" /><FormControl size="small" sx={{ minWidth: 210 }}><InputLabel id="policy-reminder-interval">Reminder interval</InputLabel><Select defaultValue="12" label="Reminder interval" labelId="policy-reminder-interval"><MenuItem value="4">Every 4 hours</MenuItem><MenuItem value="8">Every 8 hours</MenuItem><MenuItem value="12">Every 12 hours</MenuItem></Select></FormControl></Stack></Paper></Stack>;
}
