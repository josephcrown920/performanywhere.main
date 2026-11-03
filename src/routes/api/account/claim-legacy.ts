import { createFileRoute } from "@tanstack/react-router";
import { authClientId, assertClientId, adminSupabase, json, errJson } from "@/lib/server-supabase";

// Moves rows created under a pre-sign-in device id onto the signed-in account (one-time, per device).
export const Route = createFileRoute("/api/account/claim-legacy")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const uid = await authClientId(request);
          const { legacyId: raw } = (await request.json()) as { legacyId?: string };
          const legacyId = assertClientId(raw).toLowerCase();
          if (legacyId === uid) return json({ moved: 0 });
          const admin = await adminSupabase();
          // Never take over another real account's data.
          const { data: other } = await admin.auth.admin.getUserById(legacyId);
          if (other?.user) return json({ error: "forbidden" }, 403);

          let moved = 0;
          const { data: projects } = await admin.from("projects").select("id").eq("client_id", legacyId);
          moved += projects?.length ?? 0;

          // Move stored files into the account's folder and rewrite their paths.
          const movePath = async (bucket: string, path: string | null) => {
            if (!path || !path.startsWith(`${legacyId}/`)) return path;
            const next = `${uid}/${path.slice(legacyId.length + 1)}`;
            const { error } = await admin.storage.from(bucket).move(path, next);
            return error ? path : next;
          };
          const { data: assets } = await admin.from("project_assets").select("id, storage_path").eq("client_id", legacyId);
          for (const a of assets ?? []) await admin.from("project_assets").update({ client_id: uid, storage_path: (await movePath("uploads", a.storage_path)) ?? a.storage_path }).eq("id", a.id);
          for (const t of ["project_renders", "projects"] as const) {
            const { data: rows } = await admin.from(t).select("id, output_path").eq("client_id", legacyId);
            for (const r of rows ?? []) await admin.from(t).update({ client_id: uid, output_path: await movePath("renders", r.output_path) }).eq("id", r.id);
          }
          for (const t of ["generations", "purchases", "credit_ledger"] as const) await admin.from(t).update({ client_id: uid }).eq("client_id", legacyId);

          const { data: oldWallet } = await admin.from("credit_wallets").select("balance").eq("client_id", legacyId).maybeSingle();
          if (oldWallet) {
            const { data: mine } = await admin.from("credit_wallets").select("balance").eq("client_id", uid).maybeSingle();
            if (mine) {
              await admin.from("credit_wallets").update({ balance: Number(mine.balance) + Number(oldWallet.balance) }).eq("client_id", uid);
              await admin.from("credit_wallets").delete().eq("client_id", legacyId);
            } else {
              await admin.from("credit_wallets").update({ client_id: uid }).eq("client_id", legacyId);
            }
            moved += 1;
          }
          return json({ moved });
        } catch (e) {
          return errJson(e);
        }
      },
    },
  },
});
