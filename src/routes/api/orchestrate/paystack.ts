import { createFileRoute } from "@tanstack/react-router";
import { assertClientId, json, errJson } from "@/lib/server-supabase";

export const Route = createFileRoute("/api/orchestrate/paystack")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { clientId?: string; amountNaira?: number; email?: string };
          const clientId = assertClientId(body.clientId);
          const amountNaira = Number(body.amountNaira ?? 0);
          const email = body.email ?? "";
          if (!Number.isFinite(amountNaira) || amountNaira < 100) throw new Error("invalid_amount");
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("invalid_email");
          const secret = process.env.PAYSTACK_SECRET_KEY;
          if (!secret) return json({ error: "paystack_not_configured" }, 503);

          const res = await fetch("https://api.paystack.co/transaction/initialize", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
            body: JSON.stringify({ email, amount: Math.round(amountNaira * 100), metadata: { clientId } }),
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
