const sessionStorageKey = "saile-dms.auth.session";

export interface StoredSession {
  accessToken: string;
}

function getStorage(rememberDevice: boolean): Storage {
  return rememberDevice ? window.localStorage : window.sessionStorage;
}

export function readStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;

  for (const storage of [window.sessionStorage, window.localStorage]) {
    const value = storage.getItem(sessionStorageKey);
    if (value === null) continue;

    try {
      const session = JSON.parse(value) as StoredSession;
      if (typeof session.accessToken === "string" && session.accessToken.length > 0) return session;
    } catch {
      storage.removeItem(sessionStorageKey);
    }
  }

  return null;
}

export function saveSession(accessToken: string, rememberDevice: boolean): void {
  window.sessionStorage.removeItem(sessionStorageKey);
  window.localStorage.removeItem(sessionStorageKey);
  getStorage(rememberDevice).setItem(sessionStorageKey, JSON.stringify({ accessToken } satisfies StoredSession));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(sessionStorageKey);
  window.localStorage.removeItem(sessionStorageKey);
}
