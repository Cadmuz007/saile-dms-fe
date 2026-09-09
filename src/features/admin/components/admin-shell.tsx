"use client";

import AdminPanelSettingsOutlined from "@mui/icons-material/AdminPanelSettingsOutlined";
import ArticleOutlined from "@mui/icons-material/ArticleOutlined";
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import BadgeOutlined from "@mui/icons-material/BadgeOutlined";
import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import GroupOutlined from "@mui/icons-material/GroupOutlined";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import MenuRounded from "@mui/icons-material/MenuRounded";
import NotificationsNoneRounded from "@mui/icons-material/NotificationsNoneRounded";
import PolicyOutlined from "@mui/icons-material/PolicyOutlined";
import SailingOutlined from "@mui/icons-material/SailingOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import TimerOutlined from "@mui/icons-material/TimerOutlined";
import VpnKeyOutlined from "@mui/icons-material/VpnKeyOutlined";
import { AppBar, Avatar, Box, CssBaseline, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, Menu, MenuItem, Stack, ThemeProvider, Toolbar, Tooltip, Typography, createTheme } from "@mui/material";
import type { ElementType } from "react";
import { useEffect, useState } from "react";

import type { AuthenticatedUser } from "@/features/auth/types";
import type { LicenseMetrics } from "../licenses.types";
import { LicensesRequestError, listLicenses } from "@/services/licenses";

import type { AdminView } from "../types";
import { AdminContent } from "./admin-content";

const drawerWidth = 252;
const groups = ["Workspace", "Administration", "Automation"] as const;
const adminTheme = createTheme({ palette: { background: { default: "#f8fafc", paper: "#ffffff" }, primary: { main: "#810a6a", dark: "#5f074e", light: "#ad398f" }, text: { primary: "#0f172a", secondary: "#64748b" } }, shape: { borderRadius: 6 }, typography: { fontFamily: "'Inter Variable', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", h4: { fontSize: "1.5rem", fontWeight: 700 } }, components: { MuiButton: { styleOverrides: { root: { borderRadius: 6, boxShadow: "none", fontWeight: 600, textTransform: "none", "&:hover": { boxShadow: "0 3px 10px rgba(129,10,106,.18)" } } } }, MuiOutlinedInput: { styleOverrides: { root: { backgroundColor: "#ffffff", borderRadius: 6 } } }, MuiPaper: { styleOverrides: { root: { backgroundImage: "none", border: "1px solid #e2e8f0", borderRadius: 6, boxShadow: "0 1px 3px rgba(15,23,42,.04)" } } }, MuiTableCell: { styleOverrides: { head: { backgroundColor: "#f8fafc", color: "#475569", fontWeight: 700 }, root: { borderColor: "#f1f5f9" } } } } });
const navigation: Array<{ label: string; view: AdminView; icon: ElementType; group: (typeof groups)[number] }> = [
  { label: "Overview", view: "overview", icon: DashboardOutlined, group: "Workspace" }, { label: "Licensing", view: "licenses", icon: VpnKeyOutlined, group: "Administration" }, { label: "Authentication", view: "authentication", icon: AdminPanelSettingsOutlined, group: "Administration" }, { label: "Users", view: "users", icon: BadgeOutlined, group: "Administration" }, { label: "Groups", view: "groups", icon: GroupOutlined, group: "Administration" }, { label: "Permissions", view: "permissions", icon: PolicyOutlined, group: "Administration" }, { label: "Policies", view: "policies", icon: SettingsOutlined, group: "Administration" }, { label: "SLA", view: "sla", icon: TimerOutlined, group: "Administration" }, { label: "Document types", view: "document-types", icon: ArticleOutlined, group: "Automation" }, { label: "Set Sail", view: "set-sail", icon: SailingOutlined, group: "Automation" }, { label: "Set Sail AI", view: "set-sail-ai", icon: AutoAwesomeOutlined, group: "Automation" },
];

interface AdminShellProps { currentUser: AuthenticatedUser; onSignOut: () => void; }

export function AdminShell({ currentUser, onSignOut }: AdminShellProps) {
  const [activeView, setActiveView] = useState<AdminView>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountAnchor, setAccountAnchor] = useState<HTMLElement | null>(null);
  const [licenseMetrics, setLicenseMetrics] = useState<LicenseMetrics | null>(null);
  useEffect(() => {
    if (!currentUser.permissions.includes("admin.licenses.read")) return;
    const controller = new AbortController();
    listLicenses({ page: "1", pageSize: "1" }, controller.signal).then((result) => {
      if (!controller.signal.aborted) setLicenseMetrics(result.meta.metrics);
    }).catch((error: unknown) => {
      if (error instanceof LicensesRequestError && error.status === 401) onSignOut();
    });
    return () => controller.abort();
  }, [currentUser.permissions, onSignOut]);
  const fullName = `${currentUser.firstName} ${currentUser.lastName}`;
  const initials = `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`.toUpperCase();
  const sidebar = <Box sx={{ bgcolor: "#25061f", color: "#cbd5e1", height: "100%", position: "relative" }}><Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minHeight: 70, px: 3 }}><Box sx={{ alignItems: "center", bgcolor: "#810a6a", borderRadius: 1, display: "flex", height: 32, justifyContent: "center", width: 32 }}><SailingOutlined fontSize="small" sx={{ color: "white" }} /></Box><Box><Typography sx={{ color: "white", fontSize: 16, fontWeight: 800, lineHeight: 1.1 }}>Saile DMS</Typography><Typography sx={{ color: "#e597cf", fontSize: 10, fontWeight: 700, letterSpacing: ".1em" }}>ADMIN CONSOLE</Typography></Box></Stack><Box sx={{ borderBottom: "1px solid rgba(229,151,207,.14)", px: 3, py: 1.2 }}><Typography sx={{ color: "#b68faa", fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase" }}>Bureau of the Treasury</Typography></Box>{groups.map((group) => <Box key={group} sx={{ pt: 2.25 }}><Typography sx={{ color: "#9e7795", display: "block", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", pb: .75, px: 3 }}>{group.toUpperCase()}</Typography><List disablePadding sx={{ px: 1 }}>{navigation.filter((item) => item.group === group).map((item) => { const Icon = item.icon; const selected = activeView === item.view; return <ListItemButton key={item.view} onClick={() => { setActiveView(item.view); setMobileOpen(false); }} selected={selected} sx={{ "&.Mui-selected": { bgcolor: "rgba(129,10,106,.28)", borderLeftColor: "#dd72bb", color: "#ffffff", "&:hover": { bgcolor: "rgba(129,10,106,.38)", }, }, "&:hover": { bgcolor: "rgba(255,255,255,.06)", color: "#f8fafc" }, borderLeft: "3px solid transparent", borderRadius: 0, color: selected ? "white" : "#c6aeba", mb: .35, minHeight: 42, px: 1.75 }}><ListItemIcon sx={{ color: selected ? "#e597cf" : "#98788f", minWidth: 35 }}><Icon fontSize="small" /></ListItemIcon><Typography sx={{ fontSize: 13.5, fontWeight: selected ? 600 : 400 }}>{item.label}</Typography></ListItemButton>; })}</List></Box>)}{licenseMetrics && <Box sx={{ bottom: 20, left: 18, position: "absolute", right: 18 }}><Box sx={{ bgcolor: "rgba(255,255,255,.04)", border: "1px solid rgba(229,151,207,.14)", borderRadius: 1, p: 1.5 }}><Typography sx={{ color: "#f3c6e5", fontSize: 11, fontWeight: 700 }}>Organization licenses</Typography><Typography sx={{ color: "#f8fafc", fontSize: 20, fontWeight: 800, mt: .35 }}>{licenseMetrics.assigned} <Box component="span" sx={{ color: "#c5a1ba", fontSize: 11 }}>of {licenseMetrics.enabled} assigned</Box></Typography><Box sx={{ bgcolor: "#4b1640", borderRadius: 0, height: 5, mt: 1 }}><Box sx={{ bgcolor: "#d75aaa", borderRadius: 0, height: 5, width: `${licenseMetrics.enabled ? Math.round((licenseMetrics.assigned / licenseMetrics.enabled) * 100) : 0}%` }} /></Box></Box></Box>}</Box>;
  return <ThemeProvider theme={adminTheme}><CssBaseline /><Box sx={{ bgcolor: "background.default", display: "flex", minHeight: "100vh" }}><Box component="nav" sx={{ flexShrink: { md: 0 }, width: { md: drawerWidth } }}><Drawer ModalProps={{ keepMounted: true }} onClose={() => setMobileOpen(false)} open={mobileOpen} sx={{ display: { md: "none" }, "& .MuiDrawer-paper": { borderRadius: 0, boxSizing: "border-box", width: drawerWidth } }} variant="temporary">{sidebar}</Drawer><Drawer open sx={{ display: { xs: "none", md: "block" }, "& .MuiDrawer-paper": { border: 0, borderRadius: 0, boxSizing: "border-box", width: drawerWidth } }} variant="permanent">{sidebar}</Drawer></Box><Box sx={{ flexGrow: 1, minWidth: 0 }}><AppBar color="inherit" elevation={0} position="sticky" sx={{ bgcolor: "rgba(255,255,255,.96)", borderBottom: "1px solid #e2e8f0" }}><Toolbar sx={{ minHeight: "64px !important", px: { xs: 2, md: 3.5 } }}><IconButton aria-label="Open admin navigation" onClick={() => setMobileOpen(true)} sx={{ display: { md: "none" }, mr: 1 }}><MenuRounded /></IconButton><Box><Typography sx={{ fontSize: 16, fontWeight: 700, letterSpacing: "-.01em" }}>Saile DMS Admin Console</Typography><Typography sx={{ color: "text.secondary", fontSize: 10.5 }}>Bureau of the Treasury</Typography></Box><Box sx={{ flexGrow: 1 }} /><Tooltip title="Notifications"><IconButton aria-label="Notifications" sx={{ color: "text.secondary" }}><NotificationsNoneRounded fontSize="small" /></IconButton></Tooltip><Divider flexItem orientation="vertical" sx={{ mx: 2, my: 2 }} /><Box aria-controls={accountAnchor ? "admin-account-menu" : undefined} aria-expanded={accountAnchor ? "true" : undefined} aria-haspopup="menu" component="button" onClick={(event) => setAccountAnchor(event.currentTarget)} sx={{ alignItems: "center", background: "transparent", border: 0, borderRadius: 1, cursor: "pointer", display: "flex", px: 1, py: .5, textAlign: "left", "&:hover": { backgroundColor: "#f8fafc" }, "&:focus-visible": { outline: "2px solid #810a6a", outlineOffset: 2 } }} type="button"><Avatar sx={{ bgcolor: "#810a6a", fontSize: 14, fontWeight: 600, height: 34, width: 34 }}>{initials}</Avatar><Box sx={{ display: { xs: "none", sm: "block" }, ml: 1.25 }}><Typography sx={{ color: "text.primary", fontSize: 13, fontWeight: 600 }}>{fullName}</Typography><Typography sx={{ color: "text.secondary", fontSize: 11 }}>System administrator</Typography></Box></Box><Menu anchorEl={accountAnchor} anchorOrigin={{ horizontal: "right", vertical: "bottom" }} id="admin-account-menu" onClose={() => setAccountAnchor(null)} open={accountAnchor !== null} slotProps={{ paper: { sx: { minWidth: 220, mt: 1 } } }} transformOrigin={{ horizontal: "right", vertical: "top" }}><Box sx={{ px: 2, py: 1.25 }}><Typography sx={{ fontSize: 13, fontWeight: 700 }}>{fullName}</Typography><Typography sx={{ color: "text.secondary", fontSize: 11 }}>{currentUser.email}</Typography></Box><Divider /><MenuItem onClick={onSignOut}><ListItemIcon><LogoutRounded fontSize="small" /></ListItemIcon>Sign out</MenuItem></Menu></Toolbar></AppBar><AdminContent activeView={activeView} currentUser={currentUser} onSignOut={onSignOut} onLicenseMetricsChange={setLicenseMetrics} /></Box></Box></ThemeProvider>;
}
