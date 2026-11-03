import { cn } from "@/lib/utils";

const RULES: [RegExp, string][] = [
  [/claude|anthropic|fable|codex/i, "claude"],
  [/gpt|openai|astra|dall|sunburst|sora/i, "openai"],
  [/veo|imagen|nano banana|gemini|omni|google/i, "gemini"],
  [/seedream|seedance|seed|dola|omnihuman|modelark|ark|doubao/i, "bytedance"],
  [/kling/i, "kling"],
  [/flux|bfl/i, "flux"],
  [/sdxl|stable|stability/i, "stability"],
  [/recraft/i, "recraft"],
  [/ideogram/i, "ideogram"],
  [/qwen|wan\b|alibaba/i, "qwen"],
  [/deepseek/i, "deepseek"],
  [/llama|meta/i, "meta"],
  [/mistral/i, "mistral"],
  [/glm|zhipu/i, "zhipu"],
  [/minimax|hailuo/i, "minimax"],
  [/runway/i, "runway"],
  [/hugging/i, "huggingface"],
  [/openrouter/i, "openrouter"],
];

/** Maker logo for a model, matched from its name or id. */
export function logoFor(...hints: (string | undefined)[]) {
  const s = hints.filter(Boolean).join(" ");
  return RULES.find(([re]) => re.test(s))?.[1];
}

export function ModelLogo({ hints, className }: { hints: (string | undefined)[]; className?: string }) {
  const logo = logoFor(...hints);
  return (
    <span className={cn("logo-tile grid size-6 shrink-0 place-items-center rounded-md", className)} aria-hidden>
      {logo ? <img src={`/logos/${logo}.svg`} alt="" className="size-[70%] object-contain" loading="lazy" /> : <span className="font-mono text-[9px] font-bold">AI</span>}
    </span>
  );
}
