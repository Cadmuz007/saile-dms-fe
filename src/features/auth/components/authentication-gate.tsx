"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { WorkspaceShell } from "@/features/workspace/components/workspace-shell";

import { getCurrentUser, signIn } from "@/services/auth";
import { logoutSession, renewSession } from "@/services/session";
import { SessionLifecycle } from "./session-lifecycle";

import { hasAdminConsoleAccess } from "../authorization";
import { LoginScreen } from "./login-screen";
import { clearSession, readStoredSession, saveSession } from "../session-storage";
import type { AuthenticatedUser, SignInCredentials } from "../types";

export function AuthenticationGate() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [isRedirectingToAdmin, setIsRedirectingToAdmin] = useState(false);
  useEffect(() => { const cleared = () => { setCurrentUser(null); setIsRedirectingToAdmin(false); }; window.addEventListener("saile-session-cleared", cleared); return () => window.removeEventListener("saile-session-cleared", cleared); }, []);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession(): Promise<void> {
      await Promise.resolve();
      const session = readStoredSession();
      if (session === null || cancelled) {
        if (!cancelled) setIsRestoringSession(false);
        return;
      }

      try {
        const renewed = await renewSession();
        const user = await getCurrentUser(renewed.accessToken);
        if (!cancelled && hasAdminConsoleAccess(user) && !new URLSearchParams(window.location.search).has("document")) {
          setIsRedirectingToAdmin(true);
          router.replace("/admin");
          return;
        }
        if (!cancelled) setCurrentUser(user);
      } catch {
        clearSession();
      } finally {
        if (!cancelled) setIsRestoringSession(false);
      }
    }

    void restoreSession();
    return () => { cancelled = true; };
  }, [router]);

  async function handleSignIn(credentials: SignInCredentials, rememberDevice: boolean): Promise<void> {
    const session = await signIn(credentials);
    const user = await getCurrentUser(session.accessToken);
    saveSession(session.accessToken, rememberDevice, { refreshToken: session.refreshToken, idleExpiresAt: session.idleExpiresAt, sessionExpiresAt: session.sessionExpiresAt });
    if (hasAdminConsoleAccess(user) && !new URLSearchParams(window.location.search).has("document")) {
      setIsRedirectingToAdmin(true);
      router.replace("/admin");
      return;
    }
    setCurrentUser(user);
  }

  function handleSignOut(): void {
    logoutSession();
    setCurrentUser(null);
  }

  if (isRestoringSession || isRedirectingToAdmin) {
    return <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500">Restoring your secure session…</main>;
  }

  return currentUser !== null
    ? <><SessionLifecycle /><WorkspaceShell currentUser={currentUser} onSignOut={handleSignOut} /></>
    : <LoginScreen onSignIn={handleSignIn} />;
}
