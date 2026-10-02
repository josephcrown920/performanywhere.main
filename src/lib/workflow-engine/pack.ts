import type { WorkflowDefinition, WorkflowRequest, WorkflowPlan } from "./types";

export function toWorkflowPack(w: WorkflowDefinition) {
  const tier = w.tiers[planQuality(w)] ?? Object.values(w.tiers)[0];
  return {
    id: w.id,
    version: w.version,
    name: w.name,
    description: w.description,
    category: w.category,
    provider: tier?.provider,
    model: tier?.model,
    modalities: w.modalities,
    supportedAspectRatios: w.supportedAspectRatios,
    capabilities: w.capabilities,
    requirements: w.requirements,
  };
}

function planQuality(w: WorkflowDefinition): keyof WorkflowDefinition["tiers"] {
  return "balanced" in w.tiers ? "balanced" : (Object.keys(w.tiers)[0] as keyof WorkflowDefinition["tiers"]);
}

export type { WorkflowDefinition, WorkflowRequest, WorkflowPlan };
