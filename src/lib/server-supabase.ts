// Server-side Supabase helpers for API routes.
// Every signed-in API call carries the user's bearer token; queries run as that user (RLS applies).
import { createClient } from "@supabase/supabase-js";

function bearer(request?: Request): string | null {
  const h = request?.headers.get("authorization") ?? "";
  return h.toLowerCase().startsWith("bearer ") ? h.slice(7).trim() : null;
}

/** Publishable-key client. With a request, it acts as the signed-in caller. */
export function serverSupabase(request?: Request) {
  const token = bearer(request);
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  });
}

/** Privileged client — only after the caller has been verified. */
export async function adminSupabase() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Verifies the bearer token and that the claimed client id is the signed-in user. */
export async function authClientId(request: Request, claimed?: unknown): Promise<string> {
  const token = bearer(request);
  if (!token) throw new Error("unauthorized");
  const { data, error } = await serverSupabase().auth.getUser(token);
  if (error || !data.user) throw new Error("unauthorized");
  if (claimed !== undefined && claimed !== null && claimed !== data.user.id) throw new Error("forbidden");
  return data.user.id;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function assertClientId(v: unknown): string {
  if (typeof v !== "string" || !UUID_RE.test(v)) throw new Error("invalid_client_id");
  return v;
}
export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
export function errJson(e: unknown, fallbackStatus = 500) {
  const msg = e instanceof Error ? e.message : String(e);
  const status =
    msg === "invalid_client_id" ? 400 :
    msg === "unauthorized" ? 401 :
    msg === "forbidden" ? 403 :
    msg === "insufficient_credits" ? 402 : fallbackStatus;
  return json({ error: msg }, status);
}
