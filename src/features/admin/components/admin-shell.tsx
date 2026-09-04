"use client";

import AdminPanelSettingsOutlined from "@mui/icons-material/AdminPanelSettingsOutlined";
import ArticleOutlined from "@mui/icons-material/ArticleOutlined";
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import BadgeOutlined from "@mui/icons-material/BadgeOutlined";
import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import GroupOutlined from "@mui/icons-material/GroupOutlined";
import MenuRounded from "@mui/icons-material/MenuRounded";
import NotificationsNoneRounded from "@mui/icons-material/NotificationsNoneRounded";
import PolicyOutlined from "@mui/icons-material/PolicyOutlined";
import SailingOutlined from "@mui/icons-material/SailingOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import TimerOutlined from "@mui/icons-material/TimerOutlined";
import VpnKeyOutlined from "@mui/icons-material/VpnKeyOutlined";
import { AppBar, Avatar, Box, CssBaseline, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, Stack, ThemeProvider, Toolbar, Tooltip, Typography, createTheme } from "@mui/material";
import type { ElementType } from "react";
import { useState } from "react";

import type { AdminView } from "../types";
import { AdminContent } from "./admin-content";

const drawerWidth = 252;
const groups = ["Workspace", "Administration", "Automation"] as const;
const adminTheme = createTheme({
  palette: { background: { default: "#f8fafc", paper: "#ffffff" }, primary: { main: "#810a6a", dark: "#5f074e", light: "#ad398f" }, text: { primary: "#0f172a", secondary: "#64748b" } },
  shape: { borderRadius: 6 }, typography: { fontFamily: "'Inter Variable', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", h4: { fontSize: "1.5rem", fontWeight: 700 } },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 6, boxShadow: "none", fontWeight: 600, textTransform: "none", "&:hover": { boxShadow: "0 3px 10px rgba(129,10,106,.18)" } } } },
    MuiOutlinedInput: { styleOverrides: { root: { backgroundColor: "#ffffff", borderRadius: 6 } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none", border: "1px solid #e2e8f0", borderRadius: 6, boxShadow: "0 1px 3px rgba(15,23,42,.04)" } } },
    MuiTableCell: { styleOverrides: { head: { backgroundColor: "#f8fafc", color: "#475569", fontWeight: 700 }, root: { borderColor: "#f1f5f9" } } },
  },
});
const navigation: Array<{ label: string; view: AdminView; icon: ElementType; group: (typeof groups)[number] }> = [
  { label: "Overview", view: "overview", icon: DashboardOutlined, group: "Workspace" }, { label: "Licensing", view: "licenses", icon: VpnKeyOutlined, group: "Administration" }, { label: "Authentication", view: "authentication", icon: AdminPanelSettingsOutlined, group: "Administration" }, { label: "Users", view: "users", icon: BadgeOutlined, group: "Administration" }, { label: "Groups", view: "groups", icon: GroupOutlined, group: "Administration" }, { label: "Permissions", view: "permissions", icon: PolicyOutlined, group: "Administration" }, { label: "Policies", view: "policies", icon: SettingsOutlined, group: "Administration" }, { label: "SLA", view: "sla", icon: TimerOutlined, group: "Administration" }, { label: "Document types", view: "document-types", icon: ArticleOutlined, group: "Automation" }, { label: "Set Sail", view: "set-sail", icon: SailingOutlined, group: "Automation" }, { label: "Set Sail AI", view: "set-sail-ai", icon: AutoAwesomeOutlined, group: "Automation" },
];

export function AdminShell() {
  const [activeView, setActiveView] = useState<AdminView>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebar = <Box sx={{ bgcolor: "#25061f", color: "#cbd5e1", height: "100%", position: "relative" }}>
    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minHeight: 70, px: 3 }}><Box sx={{ alignItems: "center", bgcolor: "#810a6a", borderRadius: 1, display: "flex", height: 32, justifyContent: "center", width: 32 }}><SailingOutlined fontSize="small" sx={{ color: "white" }} /></Box><Box><Typography sx={{ color: "white", fontSize: 16, fontWeight: 800, lineHeight: 1.1 }}>Saile DMS</Typography><Typography sx={{ color: "#e597cf", fontSize: 10, fontWeight: 700, letterSpacing: ".1em" }}>ADMIN CONSOLE</Typography></Box></Stack>
    <Box sx={{ borderBottom: "1px solid rgba(229,151,207,.14)", px: 3, py: 1.2 }}><Typography sx={{ color: "#b68faa", fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase" }}>Bureau of the Treasury</Typography></Box>
    {groups.map((group) => <Box key={group} sx={{ pt: 2.25 }}><Typography sx={{ color: "#9e7795", display: "block", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", pb: .75, px: 3 }}>{group.toUpperCase()}</Typography><List disablePadding sx={{ px: 1 }}>{navigation.filter((item) => item.group === group).map((item) => { const Icon = item.icon; const selected = activeView === item.view; return <ListItemButton key={item.view} onClick={() => { setActiveView(item.view); setMobileOpen(false); }} selected={selected} sx={{ "&.Mui-selected": { bgcolor: "rgba(129,10,106,.28)", borderLeftColor: "#dd72bb", color: "#ffffff", "&:hover": { bgcolor: "rgba(129,10,106,.38)" } }, "&:hover": { bgcolor: "rgba(255,255,255,.06)", color: "#f8fafc" }, borderLeft: "3px solid transparent", borderRadius: 0, color: selected ? "white" : "#c6aeba", mb: .35, minHeight: 42, px: 1.75 }}><ListItemIcon sx={{ color: selected ? "#e597cf" : "#98788f", minWidth: 35 }}><Icon fontSize="small" /></ListItemIcon><Typography sx={{ fontSize: 13.5, fontWeight: selected ? 600 : 400 }}>{item.label}</Typography></ListItemButton>; })}</List></Box>)}
    <Box sx={{ bottom: 20, left: 18, position: "absolute", right: 18 }}><Box sx={{ bgcolor: "rgba(255,255,255,.04)", border: "1px solid rgba(229,151,207,.14)", borderRadius: 1, p: 1.5 }}><Typography sx={{ color: "#f3c6e5", fontSize: 11, fontWeight: 700 }}>Organization license</Typography><Typography sx={{ color: "#f8fafc", fontSize: 20, fontWeight: 800, mt: .35 }}>188 <Box component="span" sx={{ color: "#c5a1ba", fontSize: 11 }}>of 240 active</Box></Typography><Box sx={{ bgcolor: "#4b1640", borderRadius: 0, height: 5, mt: 1 }}><Box sx={{ bgcolor: "#d75aaa", borderRadius: 0, height: 5, width: "78%" }} /></Box></Box></Box>
  </Box>;
  return <ThemeProvider theme={adminTheme}><CssBaseline /><Box sx={{ bgcolor: "background.default", display: "flex", minHeight: "100vh" }}><Box component="nav" sx={{ flexShrink: { md: 0 }, width: { md: drawerWidth } }}><Drawer ModalProps={{ keepMounted: true }} onClose={() => setMobileOpen(false)} open={mobileOpen} sx={{ display: { md: "none" }, "& .MuiDrawer-paper": { borderRadius: 0, boxSizing: "border-box", width: drawerWidth } }} variant="temporary">{sidebar}</Drawer><Drawer open sx={{ display: { xs: "none", md: "block" }, "& .MuiDrawer-paper": { border: 0, borderRadius: 0, boxSizing: "border-box", width: drawerWidth } }} variant="permanent">{sidebar}</Drawer></Box><Box sx={{ flexGrow: 1, minWidth: 0 }}><AppBar color="inherit" elevation={0} position="sticky" sx={{ bgcolor: "rgba(255,255,255,.96)", borderBottom: "1px solid #e2e8f0" }}><Toolbar sx={{ minHeight: "64px !important", px: { xs: 2, md: 3.5 } }}><IconButton aria-label="Open admin navigation" onClick={() => setMobileOpen(true)} sx={{ display: { md: "none" }, mr: 1 }}><MenuRounded /></IconButton><Box><Typography sx={{ fontSize: 16, fontWeight: 700, letterSpacing: "-.01em" }}>Saile DMS Admin Console</Typography><Typography sx={{ color: "text.secondary", fontSize: 10.5 }}>Bureau of the Treasury</Typography></Box><Box sx={{ flexGrow: 1 }} /><Tooltip title="Notifications"><IconButton aria-label="Notifications" sx={{ color: "text.secondary" }}><NotificationsNoneRounded fontSize="small" /></IconButton></Tooltip><Divider flexItem orientation="vertical" sx={{ mx: 2, my: 2 }} /><Avatar sx={{ bgcolor: "#810a6a", fontSize: 14, fontWeight: 600, height: 34, width: 34 }}>JT</Avatar><Box sx={{ display: { xs: "none", sm: "block" }, ml: 1.25 }}><Typography sx={{ fontSize: 13, fontWeight: 600 }}>John Michael Torres</Typography><Typography sx={{ color: "text.secondary", fontSize: 11 }}>System administrator</Typography></Box></Toolbar></AppBar><AdminContent activeView={activeView} /></Box></Box></ThemeProvider>;
}
