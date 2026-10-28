import { createFileRoute } from "@tanstack/react-router";
import { assertClientId, authClientId, json, errJson } from "@/lib/server-supabase";
import { PLANS, CREDIT_PACK, type Region } from "@/lib/pricing";

export const Route = createFileRoute("/api/orchestrate/paystack")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { clientId?: string; region?: Region; email?: string };
          const clientId = await authClientId(request, body.clientId);
          const region: Region = body.region === "africa" ? "africa" : "international";
          const plan = PLANS[region];
          const email = body.email ?? "";
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("invalid_email");
          const secret = process.env.PAYSTACK_SECRET_KEY;
          if (!secret) return json({ error: "paystack_not_configured" }, 503);

          const res = await fetch("https://api.paystack.co/transaction/initialize", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
            body: JSON.stringify({
              email,
              amount: plan.amountMinor,
              currency: plan.currency,
              metadata: { clientId, region, credits: CREDIT_PACK },
            }),
          });
          const j = (await res.json()) as { status?: boolean; data?: { authorization_url?: string; reference?: string }; message?: string };
          if (!res.ok || !j.status || !j.data) throw new Error(j.message ?? `paystack_${res.status}`);
          return json({ authorization_url: j.data.authorization_url, reference: j.data.reference });
        } catch (e) {
          return errJson(e);
        }
      },
    },
  },
});
