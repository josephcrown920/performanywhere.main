import { createFileRoute } from "@tanstack/react-router";
import { serverSupabase, assertClientId, authClientId, adminSupabase, json, errJson } from "@/lib/server-supabase";
import { runOrchestrated } from "@/lib/ai/run";
import { isFreeModelId } from "@/lib/ai/run";
import { estimateCredits, type Modality } from "@/lib/ai/catalog";

export const Route = createFileRoute("/api/orchestrate/run")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            clientId?: string;
            modality?: Modality;
            modelId?: string;
            prompt?: string;
            options?: Record<string, unknown>;
          };
          const clientId = await authClientId(request, body.clientId);
          const modality = (body.modality ?? "text") as Modality;
          const modelId = body.modelId ?? "lovable/google/gemini-3.6-flash";
          const prompt = body.prompt ?? "";
          if (!prompt.trim()) throw new Error("prompt_required");

          const db = serverSupabase(request);
          const cost = isFreeModelId(modelId) ? 0 : estimateCredits(modality, { ...(body.options ?? {}), model: modelId });
          const { data: gen, error: genErr } = await db
            .from("generations")
            .insert({ client_id: clientId, modality, model: modelId, provider: modelId.split("/")[0], prompt, status: "running", credits_used: cost })
            .select("id")
            .single();
          if (genErr) throw new Error(genErr.message);
          const generationId = gen.id;

          if (cost > 0) {
            const { error: spendErr } = await (await adminSupabase()).rpc("spend_credits", {
              _client_id: clientId,
              _amount: cost,
              _reason: "generation",
              _description: `${modality} · ${modelId}`,
              _generation_id: generationId,
            });
            if (spendErr) {
              await db.from("generations").delete().eq("id", generationId);
              throw new Error(spendErr.message.includes("insufficient") ? "insufficient_credits" : spendErr.message);
            }
          }

          try {
            const result = await runOrchestrated({ modality, modelId, prompt, options: body.options ?? {} });
            await db
              .from("generations")
              .update({
                status: "succeeded",
                output_text: result.output_text ?? null,
                output_url: result.output_url ?? null,
                provider: result.provider,
                model: result.model,
                duration_ms: result.duration_ms,
              })
              .eq("id", generationId);
            return json({
              id: generationId,
              provider: result.provider,
              model: result.model,
              output_url: result.output_url,
              output_text: result.output_text,
              credits_used: result.credits_used,
              duration_ms: result.duration_ms,
              fallbacks_attempted: result.attempts,
            });
          } catch (runErr) {
            if (cost > 0) {
              await (await adminSupabase()).rpc("grant_credits", {
                _client_id: clientId,
                _amount: cost,
                _reason: "refund",
                _description: `Refund for failed generation ${generationId}`,
                _purchase_id: null as unknown as string,
              });
            }
            const msg = runErr instanceof Error ? runErr.message : String(runErr);
            await db.from("generations").update({ status: "failed", error_message: msg }).eq("id", generationId);
            return json({ error: msg, id: generationId }, 502);
          }
        } catch (e) {
          return errJson(e);
        }
      },
    },
  },
});
