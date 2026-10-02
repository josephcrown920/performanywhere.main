import { createFileRoute } from "@tanstack/react-router";
import { json } from "@/lib/server-supabase";
import { listWorkflows } from "@/lib/workflow-engine/registry";
import { toWorkflowPack } from "@/lib/workflow-engine/pack";

export const Route = createFileRoute("/api/workflows/")({
  server: {
    handlers: {
      GET: async () => {
        const workflows = listWorkflows().map(toWorkflowPack);
        return json({ workflows, count: workflows.length });
      },
    },
  },
});

export { json };
