/** Embedded Jutsu assistant planning layer. Never invokes paid providers without user confirmation. */
import { type JutsuProject, type JutsuStage, canAdvanceJutsu } from "./jutsu-workflow";
export type JutsuAgentIntent = "explain" | "depth" | "previz" | "preview" | "approve" | "final" | "replace-audio" | "lipsync" | "export";
export type JutsuAgentReply = { message: string; proposedStage?: JutsuStage; requiresApproval: boolean; blockedReason?: string };
const stageByIntent: Partial<Record<JutsuAgentIntent, JutsuStage>> = {
  depth:"depth", previz:"previz", preview:"preview", approve:"approved", final:"final",
  "replace-audio":"audio", lipsync:"lipsync", export:"export",
};
export function planJutsuAgentAction(project: JutsuProject, intent: JutsuAgentIntent): JutsuAgentReply {
  if (intent === "explain") return { message:"I can guide you through depth mapping, 3D previz, camera preview, final rendering, audio replacement, and lip-sync.", requiresApproval:false };
  const stage = stageByIntent[intent]!;
  if (!canAdvanceJutsu(project,stage)) return { message:`Cannot start ${stage} yet. Complete the preceding stage and provide required media first.`, requiresApproval:false, blockedReason:"Workflow prerequisites not met" };
  const paid = stage === "preview" || stage === "final" || stage === "lipsync";
  return { message: paid ? `Ready to prepare ${stage}. Review the provider quote and explicitly confirm before submission.` : `Ready to proceed to ${stage}.`, proposedStage:stage, requiresApproval:paid };
}
