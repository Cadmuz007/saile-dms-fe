"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { WorkspaceShell } from "@/features/workspace/components/workspace-shell";

import { getCurrentUser, signIn } from "@/services/auth";

import { hasAdminConsoleAccess } from "../authorization";
import { LoginScreen } from "./login-screen";
import { clearSession, readStoredSession, saveSession } from "../session-storage";
import type { AuthenticatedUser, SignInCredentials } from "../types";

export function AuthenticationGate() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [isRedirectingToAdmin, setIsRedirectingToAdmin] = useState(false);

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
        const user = await getCurrentUser(session.accessToken);
        if (!cancelled && hasAdminConsoleAccess(user)) {
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
    saveSession(session.accessToken, rememberDevice);
    if (hasAdminConsoleAccess(user)) {
      setIsRedirectingToAdmin(true);
      router.replace("/admin");
      return;
    }
    setCurrentUser(user);
  }

  function handleSignOut(): void {
    clearSession();
    setCurrentUser(null);
  }

  if (isRestoringSession || isRedirectingToAdmin) {
    return <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500">Restoring your secure session…</main>;
  }

  return currentUser !== null
    ? <WorkspaceShell currentUser={currentUser} onSignOut={handleSignOut} />
    : <LoginScreen onSignIn={handleSignIn} />;
}
