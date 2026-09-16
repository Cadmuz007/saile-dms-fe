import { io } from "socket.io-client";
import { readStoredSession } from "@/features/auth/session-storage";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const socketBaseUrl = apiBaseUrl.replace(/\/api\/v1\/?$/, "");

export function subscribeToWorkspaceChanges(onChange: () => void, onAccessChange?: () => void): () => void {
  const session = readStoredSession();
  if (!session) return () => undefined;
  const socket = io(`${socketBaseUrl}/workspace`, { auth: { token: session.accessToken }, transports: ["websocket"] });
  const renewed = () => { const current = readStoredSession(); if (!current) { socket.disconnect(); return; } socket.auth = { token: current.accessToken }; socket.disconnect().connect(); };
  const cleared = () => socket.disconnect();
  window.addEventListener("saile-session-renewed", renewed);
  window.addEventListener("saile-session-cleared", cleared);
  socket.on("folder.changed", onChange);
  socket.on("document.changed", onChange);
  socket.on("workflow.changed", onChange);
  socket.on("notification.changed", onChange);
  socket.on("workspace.access-changed", () => { onAccessChange?.(); onChange(); });
  return () => { window.removeEventListener("saile-session-renewed", renewed); window.removeEventListener("saile-session-cleared", cleared); socket.disconnect(); };
}
