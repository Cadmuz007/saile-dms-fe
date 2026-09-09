"use client";

import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import SailingOutlined from "@mui/icons-material/SailingOutlined";
import { Alert, Button, Chip, Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";

import { PageHeader } from "./admin-page-primitives";

export function SetSailAiPage() {
  const [generated, setGenerated] = useState(false);
  return <Stack spacing={3}>
    <PageHeader
      action={{ label: "Generate workflow draft", icon: <AutoAwesomeOutlined />, onClick: () => setGenerated(true) }}
      description="Describe a process and prepare a Set Sail workflow draft for administrator review."
      title="Set Sail AI"
    />
    <Alert severity="info">Set Sail AI remains a design preview. No prompt or document data is sent to an AI provider, and generated content is not persisted.</Alert>
    <Paper elevation={0} sx={{ borderRadius: 1, p: 2.5 }}>
      <Stack spacing={2}>
        <Typography sx={{ fontSize: 16, fontWeight: 750 }}>Workflow request</Typography>
        <TextField fullWidth label="Name of Set Sail" placeholder="e.g. Procurement approval" />
        <TextField fullWidth label="Description" minRows={2} multiline placeholder="Briefly describe the workflow's purpose." />
        <TextField fullWidth label="Tell us your workflow automation plan" minRows={5} multiline placeholder="Describe the approval stages, recipients, and outcomes." />
        <Button onClick={() => setGenerated(true)} startIcon={<AutoAwesomeOutlined />} sx={{ alignSelf: "flex-start" }} variant="contained">Preview draft</Button>
      </Stack>
    </Paper>
    {generated && <Paper elevation={0} sx={{ borderRadius: 1, p: 2.5 }}>
      <Stack spacing={2}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontSize: 16, fontWeight: 750 }}>Illustrative draft</Typography>
          <Chip label="Not generated or saved" size="small" />
        </Stack>
        <Divider />
        <Typography sx={{ color: "text.secondary", fontSize: 13 }}>AI provider, data-handling, review, and publication rules must be approved before this preview can create a real Set Sail draft.</Typography>
        <Button disabled startIcon={<SailingOutlined />} sx={{ alignSelf: "flex-start" }} variant="outlined">Open in Set Sail</Button>
      </Stack>
    </Paper>}
  </Stack>;
}
