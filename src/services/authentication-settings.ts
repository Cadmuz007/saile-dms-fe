import { clearSession, readStoredSession } from "@/features/auth/session-storage";
import type { AuthenticationSettings } from "@/features/admin/authentication-settings.types";
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
export class AuthenticationSettingsRequestError extends Error { constructor(message: string, readonly status: number) { super(message); } }
async function request(path: string, options: RequestInit = {}) {
  const session = readStoredSession(); if (!session) throw new AuthenticationSettingsRequestError("Your session has expired. Sign in again.", 401);
  const response = await fetch(`${apiBaseUrl}/admin/authentication${path}`, { ...options, cache: "no-store", headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` } });
  if (response.status === 401) { clearSession(); throw new AuthenticationSettingsRequestError("Your session has expired. Sign in again.", 401); }
  const payload = await response.json().catch(() => null); if (!response.ok || !payload?.success) throw new AuthenticationSettingsRequestError(payload?.error?.message ?? "Authentication settings are unavailable. Please try again.", response.status);
  return payload.data as AuthenticationSettings;
}
export function getAuthenticationSettings(signal: AbortSignal) { return request("", { signal }); }
export function updateAuthenticationSettings(isEnabled: boolean) { return request("", { method: "PATCH", body: JSON.stringify({ isEnabled, ...(!isEnabled ? { disableConfirmation: "DISABLE_EMBEDDED_SIGN_IN" } : {}) }) }); }
