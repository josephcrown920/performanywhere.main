import { useEffect, useState } from "react";
import { api, type ProviderStatus } from "@/lib/api";
import { getClientId } from "@/lib/client-id";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, AlertCircle, Loader2, KeyRound, User, CreditCard, LogOut } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import BuyCredits from "@/components/BuyCredits";

export default function Account() {
  const [providers, setProviders] = useState<ProviderStatus[] | null>(null);
  const [clientId, setCid] = useState<string>("");
  const [email, setEmail] = useState("");

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  useEffect(() => {
    setCid(getClientId());
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
    api.providerStatus()
      .then(setProviders)
      .catch(() => setProviders([]));
  }, []);

  const configured = providers?.filter((p) => p.configured) ?? [];
  const unconfigured = providers?.filter((p) => !p.configured) ?? [];

  return (
    <AppLayout>
      <main className="mx-auto max-w-3xl px-6 py-14 space-y-8">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-primary">Session</p>
          <h1 className="mt-2 font-display text-5xl">Settings</h1>
        </div>

        {/* Session card */}
        <section className="rounded-lg border border-border/50 bg-card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border/30 px-6 py-4">
            <User className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <h2 className="font-semibold">Your account</h2>
          </div>
          <div className="px-6 py-5 space-y-5">
            <div className="rounded border border-border/40 bg-background px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Signed in as</p>
              <p className="text-sm text-foreground/80 break-all">{email || clientId || "—"}</p>
            </div>
            <button onClick={signOut} className="inline-flex items-center gap-2 rounded border border-border px-4 py-2 text-sm hover:border-destructive/50 hover:text-destructive transition">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </section>

        {/* Provider keys */}
        <section className="rounded-lg border border-border/50 bg-card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border/30 px-6 py-4">
            <KeyRound className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <h2 className="font-semibold">Provider keys</h2>
          </div>
          <div className="px-6 py-4">
            <p className="text-sm text-muted-foreground mb-5">
              API keys are server-side environment variables. They are stored securely on the server and enable each provider.
            </p>

            {providers === null ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking providers…
              </div>
            ) : (
              <div className="space-y-1">
                {configured.length > 0 && (
                  <>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground pt-2 pb-1">Active</p>
                    {configured.map((p) => <ProviderRow key={p.id} provider={p} />)}
                  </>
                )}
                {unconfigured.length > 0 && (
                  <>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground pt-4 pb-1">Not configured</p>
                    {unconfigured.map((p) => <ProviderRow key={p.id} provider={p} />)}
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Credits */}
        <section className="rounded-lg border border-border/50 bg-card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border/30 px-6 py-4">
            <CreditCard className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <h2 className="font-semibold">Buy credits</h2>
          </div>
          <div className="px-6 py-5"><BuyCredits /></div>
        </section>
      </main>
    </AppLayout>
  );
}

function ProviderRow({ provider: p }: { provider: ProviderStatus }) {
  return (
    <div className="flex items-center justify-between rounded-md px-4 py-3 hover:bg-accent/30 transition">
      <div>
        <p className="text-sm font-medium">{p.label}</p>
        <p className="text-xs font-mono text-muted-foreground">{p.id}</p>
      </div>
      {p.configured ? (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
          <Check className="h-3.5 w-3.5" /> Active
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60">
          <AlertCircle className="h-3.5 w-3.5" /> Not set
        </span>
      )}
    </div>
  );
}
