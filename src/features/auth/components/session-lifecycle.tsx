"use client";
import { useEffect } from "react";
import { clearSession, readStoredSession } from "../session-storage";
import { renewSession } from "@/services/session";

/** Only trusted visible-page input calls the activity endpoint. */
export function SessionLifecycle() {
  useEffect(() => {
    let disposed = false; let lastReport = 0; let checking = false; let pendingActivity = false;
    const check = async (activity = false) => {
      if (disposed) return;
      const absoluteExpiry = Date.parse(readStoredSession()?.sessionExpiresAt ?? "");
      if (Number.isFinite(absoluteExpiry) && Date.now() >= absoluteExpiry) { clearSession(); return; }
      if (checking) { if (activity) pendingActivity = true; return; }
      checking = true;
      try { await renewSession(activity); }
      catch {
        const session = readStoredSession();
        const deadline = Math.min(Date.parse(session?.idleExpiresAt ?? ""), Date.parse(session?.sessionExpiresAt ?? ""));
        if (!disposed && Number.isFinite(deadline) && Date.now() >= deadline) clearSession();
      } finally { checking = false; if (pendingActivity && !disposed && readStoredSession()) { pendingActivity = false; void check(true); } }
    };
    const input = (event: Event) => {
      if (!event.isTrusted || document.visibilityState !== "visible" || Date.now() - lastReport < 10_000) return;
      lastReport = Date.now(); void check(true);
    };
    const visibility = () => { if (document.visibilityState === "visible") void check(); };
    const storage = () => { if (!readStoredSession()) window.dispatchEvent(new Event("saile-session-cleared")); else void check(); };
    const events = ["pointerdown", "pointermove", "keydown", "touchstart", "wheel"];
    events.forEach((name) => window.addEventListener(name, input, { passive: true }));
    window.addEventListener("storage", storage); document.addEventListener("visibilitychange", visibility);
    const timer = window.setInterval(() => { void check(); }, 30_000);
    return () => { disposed = true; window.clearInterval(timer); events.forEach((name) => window.removeEventListener(name, input)); window.removeEventListener("storage", storage); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  return null;
}
