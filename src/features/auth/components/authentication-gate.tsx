"use client";

import { useState } from "react";

import { WorkspaceShell } from "@/features/workspace/components/workspace-shell";

import { LoginScreen } from "./login-screen";

export function AuthenticationGate() {
  const [isSignedIn, setIsSignedIn] = useState(false);

  return isSignedIn ? <WorkspaceShell /> : <LoginScreen onSignIn={() => setIsSignedIn(true)} />;
}
