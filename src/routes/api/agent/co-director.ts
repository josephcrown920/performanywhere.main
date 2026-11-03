import { createFileRoute } from "@tanstack/react-router";
import { json, errJson, authClientId } from "@/lib/server-supabase";
import { gatewayText } from "@/lib/ai/gateway";

// Side-by-side co-director: chats with the artist and drafts one cinematic shot
// the New shoot page can load or generate directly.
const MODELS = ["google/gemini-3.6-flash", "openai/gpt-5.6-luna", "google/gemini-3.1-flash-lite"];

const SYSTEM = `You are the Perform Anywhere co-director, a music-video and film director working side by side with an artist.
Help them shape ONE clean cinematic shot. Ask at most one short question if something essential is missing; otherwise propose the shot.
A good shot prompt names: subject and performance, environment, camera move and lens, lighting, color grade, mood. Keep it under 70 words, one continuous shot, no on-screen text.
Reply with ONLY JSON:
{"reply": string (1-3 short sentences, friendly, direct),
 "shot": null | {"title": string, "prompt": string, "aspectRatio": "9:16"|"16:9"|"1:1", "duration": 5|10,
   "category": "cinematic-video"|"music-video"|"product-ad"|"fashion"|"social",
   "capabilities": string[] (subset of motion-transfer, identity-lock, lip-sync, beat-sync, camera-choreography, continuity)}}`;

type Msg = { role: "user" | "assistant"; content: string };

export const Route = createFileRoute("/api/agent/co-director")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await authClientId(request);
          const body = (await request.json()) as { messages?: Msg[]; context?: unknown };
          const msgs = (body.messages ?? []).slice(-16).map((m) => `${m.role === "user" ? "Artist" : "Co-director"}: ${String(m.content).slice(0, 2000)}`);
          if (!msgs.length) throw new Error("empty_message");
          const prompt = `Current shoot state: ${JSON.stringify(body.context ?? {}).slice(0, 2000)}\n\nConversation:\n${msgs.join("\n")}`;
          let text = "";
          let lastErr: unknown;
          for (const m of MODELS) {
            try { text = (await gatewayText(m, prompt, SYSTEM)).text; break; } catch (e) { lastErr = e; }
          }
          if (!text) throw lastErr ?? new Error("agent_unavailable");
          const match = text.match(/\{[\s\S]*\}/);
          let parsed: { reply?: string; shot?: unknown } = { reply: text, shot: null };
          try { if (match) parsed = JSON.parse(match[0]); } catch { /* keep raw */ }
          return json({ reply: parsed.reply ?? "Here's a shot.", shot: parsed.shot ?? null });
        } catch (e) {
          return errJson(e);
        }
      },
    },
  },
});
