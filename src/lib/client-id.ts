const KEY = "ps_client_id";

function sessionUserId(): string | null {
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (!k || !k.startsWith("sb-") || !k.endsWith("-auth-token")) continue;
    try { const id = JSON.parse(window.localStorage.getItem(k) ?? "")?.user?.id; if (id) return id; } catch { /* ignore */ }
  }
  return null;
}

export function getClientId(): string {
  const uid = sessionUserId();
  if (uid) { window.localStorage.setItem(KEY, uid); return uid; }
  let id = window.localStorage.getItem(KEY);
  if (!id || !isUuid(id)) {
    id = crypto.randomUUID();
    window.localStorage.setItem(KEY, id);
  }
  return id;
}

export function resetClientId(): string {
  const id = crypto.randomUUID();
  window.localStorage.setItem(KEY, id);
  return id;
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

/** Restore a session on this device from a session key copied elsewhere. */
export function restoreClientId(key: string): string {
  const id = key.trim().toLowerCase();
  if (!isUuid(id)) throw new Error("That doesn't look like a valid session key.");
  window.localStorage.setItem(KEY, id);
  return id;
}

/** Set by the sign-in gate: the signed-in user's id is the client id. */
export function setClientId(id: string): void {
  window.localStorage.setItem(KEY, id);
}
