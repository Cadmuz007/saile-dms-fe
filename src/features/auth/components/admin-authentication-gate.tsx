"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminShell } from "@/features/admin/components/admin-shell";
import { getCurrentUser } from "@/services/auth";

import { hasAdminConsoleAccess } from "../authorization";
import { clearSession, readStoredSession } from "../session-storage";
import type { AuthenticatedUser } from "../types";

export function AdminAuthenticationGate() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);

  useEffect(() => {
    const session = readStoredSession();
    if (session === null) {
      router.replace("/");
      return;
    }

    getCurrentUser(session.accessToken)
      .then((user) => {
        if (hasAdminConsoleAccess(user)) {
          setCurrentUser(user);
          return;
        }
        router.replace("/");
      })
      .catch(() => {
        clearSession();
        router.replace("/");
      });
  }, [router]);

  if (currentUser === null) {
    return <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500">Checking secure access…</main>;
  }

  function signOut(): void {
    clearSession();
    router.replace("/");
  }

  return <AdminShell currentUser={currentUser} onSignOut={signOut} />;
}
