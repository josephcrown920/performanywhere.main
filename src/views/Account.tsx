import { useEffect, useState } from "react";
import { api, type ProviderStatus } from "@/lib/api";
import { getClientId, resetClientId, restoreClientId } from "@/lib/client-id";
import { toast } from "sonner";
import { Check, AlertCircle, Loader2, KeyRound, User, RotateCcw, CreditCard, Copy, LogIn } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import BuyCredits from "@/components/BuyCredits";

export default function Account() {
  const [providers, setProviders] = useState<ProviderStatus[] | null>(null);
  const [clientId, setCid] = useState<string>("");
  const [restoreKey, setRestoreKey] = useState("");

  async function copyKey() {
    await navigator.clipboard.writeText(clientId);
    toast.success("Session key copied — keep it safe to open your projects on another device");
  }

  function handleRestore() {
    try {
      setCid(restoreClientId(restoreKey));
      toast.success("Session restored");
      setTimeout(() => window.location.reload(), 600);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not restore");
    }
  }

  useEffect(() => {
    setCid(getClientId());
    api.providerStatus()
      .then(setProviders)
      .catch(() => setProviders([]));
  }, []);

  function handleReset() {
    if (!confirm("Reset session? Your current projects will no longer be visible from this browser.")) return;
    const next = resetClientId();
    setCid(next);
    toast.success("Session reset — new identity generated");
    setTimeout(() => window.location.reload(), 600);
  }

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
            <h2 className="font-semibold">Your session</h2>
          </div>
          <div className="px-6 py-5 space-y-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              No account is required. Projects are tied to this browser via a UUID stored
              in localStorage. Clearing browser data or resetting the session hides them
              from this device.
            </p>
            <div className="rounded border border-border/40 bg-background px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Session ID</p>
              <p className="font-mono text-xs break-all text-foreground/80">{clientId || "—"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={copyKey} className="inline-flex items-center gap-2 rounded border border-border px-4 py-2 text-sm hover:border-primary/50 transition">
                <Copy className="h-3.5 w-3.5" /> Copy session key
              </button>
            </div>
            <div className="flex gap-2">
              <input value={restoreKey} onChange={(e) => setRestoreKey(e.target.value)} placeholder="Paste a session key to restore"
                className="flex-1 rounded border border-border bg-background px-3 py-2 text-xs font-mono outline-none focus:ring-1 focus:ring-ring" />
              <button onClick={handleRestore} disabled={!restoreKey} className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                <LogIn className="h-3.5 w-3.5" /> Restore
              </button>
            </div>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded border border-border px-4 py-2 text-sm hover:border-destructive/50 hover:text-destructive hover:bg-destructive/5 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset session
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
