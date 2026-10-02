// Server-side Supabase client for API routes (anon key, client_id-scoped data — original app model).
import { createClient } from "@supabase/supabase-js";

export function serverSupabase() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
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
  const status = msg === "invalid_client_id" ? 400 : msg === "insufficient_credits" ? 402 : fallbackStatus;
  return json({ error: msg }, status);
}
