import { createFileRoute } from "@tanstack/react-router";
import { serverSupabase, assertClientId, json, errJson } from "@/lib/server-supabase";

export const Route = createFileRoute("/api/orchestrate/wallet")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { clientId?: string };
          const clientId = assertClientId(body.clientId);
          const db = serverSupabase();
          const { data, error } = await db.from("credit_wallets").select("*").eq("client_id", clientId).maybeSingle();
          if (error) throw new Error(error.message);
          return json(
            data ?? { client_id: clientId, balance: 0, lifetime_purchased: 0, lifetime_spent: 0 },
          );
        } catch (e) {
          return errJson(e);
        }
      },
    },
  },
});
