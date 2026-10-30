import { useState } from "react";
import { X } from "lucide-react";
import { GROUPS, SCENE_PRESETS, type ScenePreset } from "@/lib/scene-presets";

export default function ScenePicker({ open, onClose, onPick, onUpload }: { open: boolean; onClose: () => void; onPick: (p: ScenePreset) => void; onUpload: (f: File) => void }) {
  const [mode, setMode] = useState<"perform" | "grwm">("perform");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl border border-white/10 bg-[#0d0a14] p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Choose a scene</h2>
          <button onClick={onClose} aria-label="Close"><X className="h-5 w-5 text-white/50" /></button>
        </div>
        <div className="mb-5 flex gap-2">
          {(["perform", "grwm"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-full border px-4 py-1.5 text-xs font-semibold ${mode === m ? "border-fuchsia-400/60 bg-fuchsia-400/15 text-fuchsia-200" : "border-white/10 text-white/50"}`}>
              {m === "perform" ? "Perform Anywhere" : "Get Ready With Me"}
            </button>
          ))}
        </div>
        {GROUPS.filter((g) => g.mode === mode).map((g) => (
          <section key={g.id} className="mb-5">
            <div className="mb-2 text-xs uppercase tracking-wider text-white/40">{g.label}</div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {SCENE_PRESETS.filter((p) => p.group === g.id).map((p) => (
                <button key={p.id} onClick={() => onPick(p)} className="group text-left">
                  <div className="aspect-[3/4] rounded-xl border border-white/10 transition group-hover:scale-[1.03] group-hover:border-fuchsia-400/60" style={{ background: p.swatch }} />
                  <div className="mt-1.5 text-xs font-medium">{p.name}</div>
                </button>
              ))}
            </div>
          </section>
        ))}
        <label className="block cursor-pointer rounded-xl border border-dashed border-white/15 p-4 text-center text-sm text-white/60 hover:border-white/30">
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
          Or upload your own scene photo
        </label>
      </div>
    </div>
  );
}
