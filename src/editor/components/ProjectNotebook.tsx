import { useEffect, useState } from "react";
import { NotebookPen } from "lucide-react";
import { readNotebook, saveNotebook } from "@/editor/lib/creative-context";

/** Running project log; every request is appended automatically and fed to the AI. */
export function ProjectNotebook() {
  const [notes, setNotes] = useState("");
  useEffect(() => {
    setNotes(readNotebook());
    const t = window.setInterval(() => setNotes((n) => { const v = readNotebook(); return v === n ? n : v; }), 2000);
    return () => window.clearInterval(t);
  }, []);
  return (
    <details className="border-b border-border pb-3">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold">
        <NotebookPen className="size-4 text-accent" /> Project notebook
        <span className="ml-auto font-mono text-[9px] text-muted-foreground">{notes.trim() ? `${notes.split("\n").length} NOTES · AUTO` : "AUTO-LOGS"}</span>
      </summary>
      <textarea aria-label="Project notebook" value={notes} onChange={(e) => { setNotes(e.target.value); saveNotebook(e.target.value); }} placeholder="Progress is logged here as you work. Add your own notes too — the AI reads them on every request." className="mt-3 min-h-28 w-full resize-y rounded-md border border-input bg-background p-3 text-xs leading-relaxed outline-none focus:border-primary" />
    </details>
  );
}
