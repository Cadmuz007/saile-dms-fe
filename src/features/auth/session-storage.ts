const sessionStorageKey = "saile-dms.auth.session";

export interface StoredSession {
  accessToken: string;
  refreshToken?: string;
  idleExpiresAt?: string;
  sessionExpiresAt?: string;
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

export function saveSession(accessToken: string, rememberDevice: boolean, details: Omit<StoredSession, "accessToken"> = {}): void {
  window.sessionStorage.removeItem(sessionStorageKey);
  window.localStorage.removeItem(sessionStorageKey);
  getStorage(rememberDevice).setItem(sessionStorageKey, JSON.stringify({ accessToken, ...details } satisfies StoredSession));
}

export function updateSession(expectedRefreshToken: string, details: Partial<StoredSession>): boolean {
  const current = readStoredSession();
  if (current?.refreshToken !== expectedRefreshToken) return false;
  const storage = window.sessionStorage.getItem(sessionStorageKey) ? window.sessionStorage : window.localStorage;
  storage.setItem(sessionStorageKey, JSON.stringify({ ...current, ...details }));
  window.dispatchEvent(new Event("saile-session-renewed"));
  return true;
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  const existed = Boolean(readStoredSession());
  window.sessionStorage.removeItem(sessionStorageKey);
  window.localStorage.removeItem(sessionStorageKey);
  if (existed) window.dispatchEvent(new Event("saile-session-cleared"));
}
