import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { LLMS, type LlmId } from "@/agent/lib/pro-presets";

export const WORKSPACES = [
  { to: "/agent", icon: "🎨", name: "Generator & Director", note: "Images, video and the creative director" },
  { to: "/agent/storyboard", icon: "🗂", name: "Storyboard", note: "Scene brief to shot-by-shot prompts" },
  { to: "/agent/timeline", icon: "🎬", name: "Multi-Track Timeline", note: "V1–V4, A1–A3, beat markers, effects" },
  { to: "/agent/beat-director", icon: "⚡", name: "Beat Sync Director", note: "Upload a track, get a cut on the beat" },
  { to: "/agent/workflows", icon: "🧩", name: "Workflows", note: "ComfyUI import, build and run" },
  { to: "/agent/photo-lab", icon: "📸", name: "Photo Lab", note: "Filters, retouch and upscale" },
  { to: "/agent/studio", icon: "🎥", name: "Video Studio", note: "Crew chat, Layers, Perform, Canvas, Terminal, Lip sync" },
] as const;

export const LLM_KEY = "aurora_llm";

export function useLlm(): [LlmId, (v: LlmId) => void] {
  const [llm, setLlm] = useState<LlmId>("openai/gpt-6-astra");
  useEffect(() => {
    const saved = window.localStorage.getItem(LLM_KEY) as LlmId | null;
    if (saved && LLMS.some((l) => l.id === saved)) setLlm(saved);
  }, []);
  return [
    llm,
    (v: LlmId) => {
      setLlm(v);
      window.localStorage.setItem(LLM_KEY, v);
    },
  ];
}

export function StudioNav() {
  const [embedded, setEmbedded] = useState(true);
  const [modelOpen, setModelOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [llm, setLlm] = useLlm();
  const wrap = useRef<HTMLDivElement>(null);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const current = WORKSPACES.find((w) => w.to === path) ?? WORKSPACES[0];

  useEffect(() => {
    setEmbedded(window.self !== window.top);
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) {
        setModelOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <>
    <button className="aurora-side-toggle" aria-label="Open menu" onClick={() => setOpen((v) => !v)}>☰</button>
    {open && <div className="aurora-side-scrim" onClick={() => setOpen(false)} />}
    <div className={`aurora-nav aurora-side${open ? " open" : ""}`} ref={wrap}>
      <Link to="/agent" className="aurora-nav-brand">
        <span className="dot" /> Aurora Studio
      </Link>

      <nav className="aurora-nav-tabs" aria-label="Studio">
        {!embedded && <Link to="/agent/editor" className="aurora-nav-tab" title="Open the connected editor"><span className="ico">▣</span><span>Unified editor</span></Link>}
        {WORKSPACES.map((w) => (
          <Link key={w.to} to={w.to} className={`aurora-nav-tab${w.to === current.to ? " active" : ""}`} title={w.note} onClick={() => setOpen(false)}>
            <span className="ico">{w.icon}</span>
            <span>{w.name}</span>
          </Link>
        ))}
      </nav>

      <div className="aurora-nav-right">
        <div className="aurora-nav-switch">
          <button className="aurora-nav-pill" onClick={() => setModelOpen((v) => !v)}>
            {LLMS.find((l) => l.id === llm)?.label ?? "Model"} <span className="chev">▾</span>
          </button>
          {modelOpen && (
            <div className="aurora-nav-menu right">
              {LLMS.map((l) => (
                <button
                  key={l.id}
                  className={`aurora-nav-item${l.id === llm ? " active" : ""}`}
                  onClick={() => {
                    setLlm(l.id);
                    setModelOpen(false);
                  }}
                >
                  <span className="ico">◆</span>
                  <span>
                    <strong>{l.label}</strong>
                    <em>{l.id}</em>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
