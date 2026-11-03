import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AgentDock } from "@/agent/components/studio/AgentDock";
import "@/agent/guy-studio.css";

export const Route = createFileRoute("/agent")({
  component: AgentLayout,
});

function AgentLayout() {
  return (
    <>
      <Outlet />
      <AgentDock />
    </>
  );
}
