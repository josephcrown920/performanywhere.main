import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { adminSupabase, json } from "@/lib/server-supabase";

// Paystack webhook: verifies the x-paystack-signature (HMAC SHA512 of the raw body
// with PAYSTACK_SECRET_KEY) before granting any credits. Credits: 1 per 10 naira.
export const Route = createFileRoute("/api/public/paystack-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!secret) return json({ error: "paystack_not_configured" }, 503);

        const raw = await request.text();
        const signature = request.headers.get("x-paystack-signature") ?? "";
        const expected = createHmac("sha512", secret).update(raw).digest("hex");
        const a = Buffer.from(signature);
        const b = Buffer.from(expected);
        if (!signature || a.length !== b.length || !timingSafeEqual(a, b)) {
          return json({ error: "invalid_signature" }, 401);
        }

        let event: { event?: string; data?: Record<string, unknown> };
        try {
          event = JSON.parse(raw);
        } catch {
          return json({ error: "invalid_json" }, 400);
        }
        if (event.event !== "charge.success") return json({ received: true });

        const data = event.data ?? {};
        const reference = String(data.reference ?? "");
        const amountMinor = Number(data.amount ?? 0);
        const metadata = (data.metadata ?? {}) as { clientId?: string; credits?: number };
        const currency = String(data.currency ?? "NGN");
        const clientId = metadata.clientId;
        if (!reference || !clientId) return json({ error: "missing_reference_or_client" }, 400);

        const db = await adminSupabase();
        // Pack size comes from server-set metadata (signature already verified); fall back to 1 credit per 10 naira.
        const credits = Number(metadata.credits) > 0 ? Math.floor(Number(metadata.credits)) : Math.floor(amountMinor / 1000);
        const { data: existing } = await db.from("purchases").select("id").eq("paystack_reference", reference).maybeSingle();
        if (existing) return json({ received: true, duplicate: true });

        const { data: purchase, error: pErr } = await db
          .from("purchases")
          .insert({ client_id: clientId, paystack_reference: reference, amount_paid_minor: amountMinor, currency, credits_allocated: credits, raw_event: event as never })
          .select("id")
          .single();
        if (pErr) throw new Error(pErr.message);
        const { error: gErr } = await db.rpc("grant_credits", {
          _client_id: clientId,
          _amount: credits,
          _reason: "purchase",
          _description: `Paystack purchase ${reference}`,
          _purchase_id: purchase.id,
        });
        if (gErr) throw new Error(gErr.message);
        return json({ received: true, credits });
      },
    },
  },
});
