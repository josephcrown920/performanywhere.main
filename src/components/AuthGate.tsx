import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { setClientId, takeLegacyClientId, clearLegacyClientId } from "@/lib/client-id";

/** Moves projects, renders and credits made on this device before sign-in onto the signed-in account. */
async function claimLegacy(s: Session) {
  const legacyId = takeLegacyClientId();
  if (!legacyId || legacyId === s.user.id) return;
  try {
    const r = await fetch("/api/account/claim-legacy", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.access_token}` }, body: JSON.stringify({ legacyId }) });
    if (!r.ok) return;
    clearLegacyClientId();
    const { moved } = (await r.json()) as { moved?: number };
    if (moved) toast.success("Your earlier projects and credits were added to your account");
  } catch { /* try again next visit */ }
}
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

/** Shows the sign-in screen until there is a session; then the signed-in user id becomes the client id. */
export default function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) setClientId(s.user.id);
      setSession(s);
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) { setClientId(s.user.id); void claimLegacy(s); }
      setSession(s);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!session) return <SignIn />;
  return <>{children}</>;
}

function SignIn() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        if (!data.session) toast.success("Check your email to confirm your account.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally { setBusy(false); }
  }

  async function oauth(provider: "google" | "lovable") {
    const r = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (r.error) toast.error(r.error.message ?? "Sign-in failed");
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-display text-4xl">{mode === "in" ? "Sign in" : "Create account"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Your projects, renders and credits follow your account on every device.</p>
      <div className="mt-8 space-y-2">
        <button onClick={() => oauth("google")} className="w-full rounded border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-primary/50">Continue with Google</button>
        <button onClick={() => oauth("lovable")} className="w-full rounded border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-primary/50">Continue with Lovable</button>
      </div>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email"
          className="w-full rounded border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring" />
        <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" aria-label="Password"
          className="w-full rounded border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring" />
        <button disabled={busy} className="w-full rounded bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
          {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
        </button>
      </form>
      <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 text-sm text-muted-foreground hover:text-foreground">
        {mode === "in" ? "No account? Create one" : "Have an account? Sign in"}
      </button>
      <p className="mt-6 text-xs text-muted-foreground">By continuing you agree to our <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy Policy</a>.</p>
    </main>
  );
}
