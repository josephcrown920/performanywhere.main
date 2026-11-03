import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import "@/editor/editor.css";

// GUI Video Editor, merged as the Perform Anywhere Editor. Its theme is scoped to
// .gve; the class also goes on <body> so dialogs and popovers share the look.
export const Route = createFileRoute("/editor")({
  head: () => ({
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&display=swap",
      },
    ],
  }),
  component: EditorLayout,
});

function EditorLayout() {
  useEffect(() => {
    document.body.classList.add("gve");
    return () => document.body.classList.remove("gve");
  }, []);
  return (
    <div className="gve min-h-screen">
      <Outlet />
    </div>
  );
}
