import { io } from "socket.io-client";
import { readStoredSession } from "@/features/auth/session-storage";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const socketBaseUrl = apiBaseUrl.replace(/\/api\/v1\/?$/, "");

export function subscribeToWorkspaceChanges(onChange: () => void): () => void {
  const session = readStoredSession();
  if (!session) return () => undefined;
  const socket = io(`${socketBaseUrl}/workspace`, { auth: { token: session.accessToken }, transports: ["websocket"] });
  socket.on("folder.changed", onChange);
  socket.on("document.changed", onChange);
  return () => socket.disconnect();
}
