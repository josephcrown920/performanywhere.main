import { createFileRoute } from "@tanstack/react-router";
import { serverSupabase, authClientId, assertClientId, json, errJson } from "@/lib/server-supabase";
import { loadSoul } from "@/lib/soul.server";

// Writes a short, non-sensitive look description used in every Soul prompt.
export const Route = createFileRoute("/api/soul/profile")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await authClientId(request);
          const body = (await request.json()) as { soulId?: string };
          const soulId = assertClientId(body.soulId);
          const db = serverSupabase(request);
          const { refs } = await loadSoul(db, soulId, 4);
          let description = "";
          for (const model of ["google/gemini-3.8-flash", "google/gemini-3.1-flash-lite"]) {
            const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.LOVABLE_API_KEY}` },
              body: JSON.stringify({
                model,
                messages: [{ role: "user", content: [
                  { type: "text", text: "These photos show one person. In under 70 words, describe only stable visual traits a film crew needs for continuity: face shape, skin tone, hair, facial hair, tattoos, jewelry, build. No names, no guesses about identity." },
                  ...refs.map((url) => ({ type: "image_url", image_url: { url } })),
                ] }],
              }),
            });
            if (!res.ok) continue;
            const j = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
            description = j.choices?.[0]?.message?.content?.trim() ?? "";
            if (description) break;
          }
          if (!description) throw new Error("profile_failed");
          await db.from("souls").update({ reference_profile: { description }, updated_at: new Date().toISOString() }).eq("id", soulId);
          return json({ description });
        } catch (e) { return errJson(e); }
      },
    },
  },
});
