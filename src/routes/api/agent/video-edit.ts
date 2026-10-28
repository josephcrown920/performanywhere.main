import { createFileRoute } from "@tanstack/react-router";
import { json, errJson, authClientId } from "@/lib/server-supabase";
import { gatewayText } from "@/lib/ai/gateway";

// Prompt-driven video editing agent. Turns a natural-language instruction plus the
// current timeline into a list of edit operations the browser applies.
const AGENTS: Record<string, string> = {
  gemini: "google/gemini-3.6-flash",
  sol: "openai/gpt-5.6-sol",
  luna: "openai/gpt-5.6-luna",
};

const SYSTEM = `You are a video editing agent inside a timeline editor. You receive the current timeline as JSON and an instruction.
Reply with ONLY JSON: {"reply": string, "ops": Op[]}. Times are seconds on the timeline.
Op types:
{"op":"split","at":number}
{"op":"trim","clipId":string,"in":number,"out":number}   // in/out are seconds inside the source clip
{"op":"delete","clipId":string}
{"op":"speed","clipId":string,"rate":number}             // 0.25..4
{"op":"move","clipId":string,"index":number}
{"op":"filter","clipId":string,"filter":"none"|"bw"|"warm"|"cool"|"vivid"|"cinematic"|"depth"}
{"op":"text","at":number,"duration":number,"text":string}
{"op":"volume","clipId":string,"volume":number}          // 0..1
Use only clip ids that exist. Keep "reply" to one short sentence describing what you did.`;

export const Route = createFileRoute("/api/agent/video-edit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await authClientId(request);
          const body = (await request.json()) as { agent?: string; instruction?: string; timeline?: unknown };
          const instruction = (body.instruction ?? "").slice(0, 2000);
          if (!instruction.trim()) throw new Error("empty_instruction");
          const model = AGENTS[body.agent ?? "gemini"] ?? AGENTS.gemini;
          const { text } = await gatewayText(
            model,
            `Timeline:\n${JSON.stringify(body.timeline ?? {}).slice(0, 20000)}\n\nInstruction: ${instruction}`,
            SYSTEM,
          );
          const m = text.match(/\{[\s\S]*\}/);
          const parsed = m ? (JSON.parse(m[0]) as { reply?: string; ops?: unknown[] }) : { reply: text, ops: [] };
          return json({ reply: parsed.reply ?? "Done.", ops: Array.isArray(parsed.ops) ? parsed.ops : [], model });
        } catch (e) {
          return errJson(e);
        }
      },
    },
  },
});
