import { createFileRoute } from "@tanstack/react-router";
import { json, errJson } from "@/lib/server-supabase";
import { planWorkflow } from "@/lib/workflow-engine/planner";
import { toWorkflowPack, type WorkflowRequest } from "@/lib/workflow-engine/pack";

export const Route = createFileRoute("/api/workflows/plan")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as Partial<WorkflowRequest>;
          const plan = planWorkflow(body as WorkflowRequest);
          return json({ ...plan, workflow: toWorkflowPack(plan.workflow as never) });
        } catch (e) {
          return errJson(e);
        }
      },
    },
  },
});

export { json };
