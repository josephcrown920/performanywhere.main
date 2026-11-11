import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { getClientId } from "@/lib/client-id";
import { PLANS, CREDIT_PACK, detectRegion, type Region } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";

export default function BuyCredits({ compact = false }: { compact?: boolean }) {
  const [region, setRegion] = useState<Region>("international");
  const [email, setEmail] = useState("");
  useEffect(() => {
    setRegion(detectRegion());
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
    });
  }, []);

  const buy = useMutation({
    mutationFn: () => {
      if (!email) throw new Error("Enter your email first");
      return api.initPaystack({ clientId: getClientId(), region, email });
    },
    onSuccess: (r) => { if (r?.authorization_url) window.location.href = r.authorization_url; },
    onError: (e: Error) =>
      toast.error(e.message.includes("paystack_not_configured") ? "Payments are not switched on yet." : e.message),
  });

  const plan = PLANS[region];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1.5">
        {(Object.keys(PLANS) as Region[]).map((r) => (
          <button key={r} onClick={() => setRegion(r)}
            className={`rounded border px-2 py-1.5 text-xs transition ${region === r ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
            {PLANS[r].label}
          </button>
        ))}
      </div>
      {!compact && (
        <p className="text-sm text-muted-foreground">
          {CREDIT_PACK.toLocaleString()} credits for <span className="font-semibold text-foreground">{plan.display}</span>
        </p>
      )}
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email for receipt"
        className="w-full rounded border border-border bg-background px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring" />
      <button onClick={() => buy.mutate()} disabled={buy.isPending}
        className="w-full inline-flex items-center justify-center gap-2 rounded bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
        {buy.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Buy {CREDIT_PACK.toLocaleString()} credits · {plan.display}
      </button>
      {!compact && <p className="text-[11px] text-muted-foreground">Secure checkout by Paystack. Credits are added automatically after payment confirmation.</p>}
    </div>
  );
}
