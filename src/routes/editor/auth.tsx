import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clapperboard, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/editor/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Perform Anywhere Editor" },
      { name: "description", content: "Sign in to sync your studio sessions and generation gallery across devices." },
      { property: "og:title", content: "Sign in — Perform Anywhere Editor" },
      { property: "og:description", content: "Sign in to sync your studio sessions and generation gallery across devices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void navigate({ to: "/editor" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit() {
    setBusy(true);
    setMsg("");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        if (!data.session) setMsg("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setMsg("");
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { setMsg(result.error.message); return; }
    if (result.redirected) return;
    void navigate({ to: "/editor" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border glass-panel p-6">
        <p className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <Clapperboard className="size-3.5 text-accent" /> Perform Anywhere Editor
        </p>
        <h1 className="font-display text-2xl font-bold">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-1 text-xs text-muted-foreground">Sync sessions and your generation gallery across devices.</p>
        <div className="mt-5 space-y-3">
          {mode === "signup" && (
            <input aria-label="Display name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
          )}
          <input aria-label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
          <input aria-label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
            onKeyDown={(e) => e.key === "Enter" && void submit()}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
          {msg && <p className="text-xs text-accent">{msg}</p>}
          <Button onClick={() => void submit()} disabled={busy || !email || !password} className="w-full">
            {busy ? <Loader2 className="size-4 animate-spin" /> : mode === "signin" ? "Sign in" : "Sign up"}
          </Button>
          <Button variant="outline" className="w-full" disabled={busy} onClick={() => void google()}>
            Continue with Google
          </Button>
          <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMsg(""); }}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground">
            {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
          <button type="button" onClick={() => void navigate({ to: "/editor" })} className="w-full text-center text-xs text-muted-foreground hover:text-foreground">
            Continue without an account
          </button>
        </div>
      </div>
    </main>
  );
}
