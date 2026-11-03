import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import "@/agent/aurora.css";
import { StudioNav } from "@/agent/components/studio/StudioNav";
import { AuthPanel } from "@/agent/components/studio/AuthPanel";
import { supabase } from "@/integrations/supabase/client";
import { generateStoryboard, type StoryboardShot } from "@/agent/lib/storyboard.functions";
import { loadTimeline, newId, saveTimeline } from "@/agent/lib/timeline-state";

export const Route = createFileRoute("/agent/storyboard")({
  head: () => ({
    meta: [
      { title: "Storyboard Agent — Aurora Studio" },
      { name: "description", content: "Type a scene brief and get a shot-by-shot storyboard with ready-to-use generation prompts." },
      { property: "og:title", content: "Storyboard Agent — Aurora Studio" },
      { property: "og:description", content: "Scene brief in, shot list with camera, light and prompts out." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StoryboardPage,
});

type Board = { title: string; logline: string; shots: StoryboardShot[] };

function StoryboardPage() {
  const run = useServerFn(generateStoryboard);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [brief, setBrief] = useState("");
  const [refs, setRefs] = useState("");
  const [count, setCount] = useState(6);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [board, setBoard] = useState<Board | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => data.subscription.unsubscribe();
  }, []);

  const go = async () => {
    if (!brief.trim() || busy) return;
    setBusy(true);
    setError("");
    setNote("");
    try {
      const referenceUrls = refs.split(/\s+/).filter((u) => /^https?:\/\//.test(u)).slice(0, 10);
      setBoard(await run({ data: { concept: brief.trim(), referenceUrls, shotCount: count } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Storyboard failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const toTimeline = () => {
    if (!board) return;
    const doc = loadTimeline();
    let t = doc.clips.filter((c) => c.track === "V1").reduce((m, c) => Math.max(m, c.start + c.duration), 0);
    const clips = board.shots.map((s) => {
      const c = { id: newId(), track: "V1" as const, start: +t.toFixed(3), duration: s.seconds, name: `${s.shot}. ${s.title}`, kind: "video" as const, prompt: s.prompt, camera: s.camera };
      t += s.seconds;
      return c;
    });
    saveTimeline({ ...doc, seconds: Math.max(doc.seconds, Math.ceil(t)), clips: [...doc.clips, ...clips] });
    window.dispatchEvent(new Event("aurora:timeline"));
    setNote(`${clips.length} shots added to the Main footage track.`);
  };

  return (
    <div className="aurora-body aurora-page">
      <StudioNav />
      <div className="aurora-wrap">
        <h1 className="aurora-page-title">Storyboard Agent</h1>
        <p className="aurora-page-sub">Describe a scene. Get a numbered shot list with camera, light and a prompt for each shot.</p>

        {signedIn === false && <AuthPanel onSignedIn={() => setSignedIn(true)} />}

        <div className="aurora-sb-form">
          <textarea rows={5} placeholder="e.g. NBA Josh walks out of a flooded Port Harcourt alley at night, chrome chain catching the rain, crew behind him, drill energy builds to a rooftop hook." value={brief} onChange={(e) => setBrief(e.target.value.slice(0, 6000))} />
          <input placeholder="Optional reference image links (space separated)" value={refs} onChange={(e) => setRefs(e.target.value)} />
          <div className="aurora-sb-row">
            <label>Shots <input type="number" min={4} max={10} value={count} onChange={(e) => setCount(Math.min(10, Math.max(4, Number(e.target.value) || 6)))} /></label>
            <button className="aurora-sb-go" onClick={go} disabled={busy || !brief.trim() || !signedIn}>{busy ? "Building storyboard…" : "Generate storyboard"}</button>
          </div>
          {error && <p className="aurora-sb-err">{error}</p>}
        </div>

        {board && (
          <div className="aurora-sb-board">
            <div className="aurora-sb-head">
              <div><h2>{board.title}</h2><p>{board.logline}</p></div>
              <button onClick={toTimeline}>Send to timeline</button>
            </div>
            {note && <p className="aurora-sb-note">{note}</p>}
            {board.shots.map((s) => (
              <article key={s.shot} className="aurora-sb-shot">
                <header><span className="n">{s.shot}</span><strong>{s.title}</strong><em>{s.seconds}s</em></header>
                <p>{s.action}</p>
                <dl>
                  <dt>Camera</dt><dd>{s.camera}</dd>
                  <dt>Light</dt><dd>{s.lighting}</dd>
                  {s.wardrobe && (<><dt>Wardrobe</dt><dd>{s.wardrobe}</dd></>)}
                </dl>
                <div className="aurora-sb-prompt">
                  <code>{s.prompt}</code>
                  <button onClick={() => navigator.clipboard?.writeText(s.prompt)}>Copy prompt</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
