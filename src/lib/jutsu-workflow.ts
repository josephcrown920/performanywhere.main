/** Jutsu Camera production workflow. Pure state/pricing helpers; provider calls belong server-side. */
export type JutsuStage = "source" | "depth" | "previz" | "preview" | "approved" | "final" | "audio" | "lipsync" | "export";
export type CameraKeyframe = { time: number; action: "push" | "arc-left" | "crane-over" | "arc-right-descend" | "pullback-lock" };
export const JUTSU_CAMERA_PATH: readonly CameraKeyframe[] = [
  { time: 0, action: "push" }, { time: 1.8, action: "arc-left" },
  { time: 3.2, action: "crane-over" }, { time: 4.7, action: "arc-right-descend" },
  { time: 5.8, action: "pullback-lock" }, { time: 8, action: "pullback-lock" },
];
export type JutsuProject = {
  id: string;
  sourceKind: "video" | "image";
  stage: JutsuStage;
  sourceUrl: string;
  originalAudioUrl?: string;
  replacementAudioUrl?: string;
  depthMapUrl?: string;
  previzUrl?: string;
  previewUrl?: string;
  finalUrl?: string;
  lipsyncedUrl?: string;
  cameraPath: CameraKeyframe[];
  previewApproved: boolean;
};
export function estimateJutsuPricing(finalProviderCostCredits: number, previewProviderCostCredits: number, previewCreditApplied = 0) {
  for (const n of [finalProviderCostCredits, previewProviderCostCredits, previewCreditApplied]) {
    if (!Number.isFinite(n) || n < 0) throw new Error("Credits must be nonnegative finite numbers");
  }
  if (previewCreditApplied > previewProviderCostCredits || previewCreditApplied > finalProviderCostCredits) throw new Error("Invalid preview credit");
  return {
    finalCredits: finalProviderCostCredits,
    previewCredits: previewProviderCostCredits,
    isHalfPriceOrLess: previewProviderCostCredits <= finalProviderCostCredits / 2,
    previewCreditApplied,
    finalAfterApprovalCredits: finalProviderCostCredits - previewCreditApplied,
    combinedCredits: previewProviderCostCredits + finalProviderCostCredits - previewCreditApplied,
  };
}
export function canAdvanceJutsu(project: JutsuProject, target: JutsuStage): boolean {
  const order: JutsuStage[] = ["source", "depth", "previz", "preview", "approved", "final", "audio", "lipsync", "export"];
  const current = order.indexOf(project.stage), next = order.indexOf(target);
  if (next !== current + 1) return false;
  if (target === "previz" && !project.depthMapUrl) return false;
  if (target === "preview" && !project.previzUrl) return false;
  if (target === "approved" && !project.previewUrl) return false;
  if (target === "final" && !project.previewApproved) return false;
  if (target === "audio" && !project.finalUrl) return false;
  if (target === "lipsync" && !project.replacementAudioUrl) return false;
  if (target === "export" && !project.lipsyncedUrl) return false;
  return true;
}
export const JUTSU_PROVIDER_REQUIREMENTS = {
  depth: "Generate per-frame depth estimates and confidence; optionally reconstruct geometry.",
  previz: "Render low-cost 3D camera-path visualization using available depth/geometry.",
  preview: "Request provider-backed low-quality camera motion render; quote real provider cost first.",
  final: "Render approved camera trajectory using source media and cached geometry where supported.",
  lipsync: "After final camera render, synchronize face to replacement vocal audio while preserving original audio timing.",
} as const;
