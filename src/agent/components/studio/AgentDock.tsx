import "@/agent/aurora.css";
import { useEffect, useRef, useState } from "react";
import { loadTimeline, newId, saveTimeline, type Clip } from "@/agent/lib/timeline-state";

type Msg = { role: "user" | "assistant"; content: string };
const KEY = "aurora_agent_chat_v1";
const AUTO_KEY = "aurora_agent_auto";
export const TIMELINE_EVENT = "aurora:timeline";

const MEDIA_RE = /https?:\/\/[^\s)"'<>\]]+/g;
function mediaUrls(text: string) {
  return [...new Set(text.match(MEDIA_RE) ?? [])].filter((u) => /\.(mp4|mov|webm|png|jpe?g|webp)(\?|$)/i.test(u) || /video|image|tos-/i.test(u));
}
const isVideo = (u: string) => /\.(mp4|mov|webm)(\?|$)/i.test(u) || /video/i.test(u);

export function addMediaToTimeline(url: string, name = "Agent shot") {
  const doc = loadTimeline();
  const video = isVideo(url);
  const track = video ? "V1" : "V2";
  const end = Math.max(0, ...doc.clips.filter((c) => c.track === track).map((c) => c.start + c.duration));
  const clip: Clip = { id: newId(), track, start: +Math.min(end, Math.max(0, doc.seconds - 1)).toFixed(3), duration: video ? 5 : 3, name, kind: video ? "video" : "image", src: url };
  saveTimeline({ ...doc, seconds: Math.max(doc.seconds, clip.start + clip.duration), clips: [...doc.clips, clip] });
  window.dispatchEvent(new Event(TIMELINE_EVENT));
}

export function AgentDock() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [auto, setAuto] = useState(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState<string[]>([]);
  const end = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      setMsgs(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
      setAuto(localStorage.getItem(AUTO_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(msgs.slice(-60)));
    end.current?.scrollIntoView({ block: "end" });
  }, [msgs]);

  const toggleAuto = () => {
    setAuto((v) => {
      localStorage.setItem(AUTO_KEY, v ? "0" : "1");
      return !v;
    });
  };

  const addUrl = (u: string) => {
    addMediaToTimeline(u);
    setAdded((a) => [...a, u]);
  };

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setError("");
    setInput("");
    const content = auto && !text.includes("--confirmed") ? `${text} --confirmed` : text;
    const history: Msg[] = [...msgs, { role: "user", content }];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setBusy(true);
    const ctrl = new AbortController();
    abort.current = ctrl;
    let reply = "";
    try {
      const res = await fetch("/api/va/agent-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-30) }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? `Agent error ${res.status}`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const l = line.trim();
          if (!l.startsWith("data:")) continue;
          const data = l.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const j = JSON.parse(data);
            const delta = j.choices?.[0]?.delta?.content ?? j.choices?.[0]?.message?.content ?? "";
            if (delta) {
              reply += delta;
              setMsgs([...history, { role: "assistant", content: reply }]);
            }
          } catch {
            /* partial */
          }
        }
      }
      if (auto) mediaUrls(reply).forEach((u) => addUrl(u));
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
      if (!reply) setMsgs(history);
    } finally {
      setBusy(false);
      abort.current = null;
    }
  }

  return (
    <>
      <button className="aurora-agent-fab" onClick={() => setOpen((v) => !v)} aria-label="Open studio agent">
        {open ? "✕" : "◎ Agent"}
      </button>
      {open && (
        <aside className="aurora-agent-dock">
          <header>
            <div>
              <strong>Perform Anywhere agent</strong>
              <em>Dola Seed · GLM-5 · ModelArk</em>
            </div>
            <button className={`aurora-agent-auto${auto ? " on" : ""}`} onClick={toggleAuto} title="Auto mode: agent generates without asking, and results go straight onto the timeline">
              Auto {auto ? "on" : "off"}
            </button>
          </header>
          <div className="aurora-agent-log">
            {!msgs.length && <p className="dim">Describe your video. The agent researches, writes, storyboards and generates — results can drop straight onto your timeline.</p>}
            {msgs.map((m, i) => (
              <div key={i} className={`aurora-agent-msg ${m.role}`}>
                <p>{m.content || (busy && i === msgs.length - 1 ? "…" : "")}</p>
                {m.role === "assistant" &&
                  mediaUrls(m.content).map((u) => (
                    <div key={u} className="aurora-agent-media">
                      {isVideo(u) ? <video src={u} controls muted playsInline /> : <img src={u} alt="Agent result" />}
                      <button disabled={added.includes(u)} onClick={() => addUrl(u)}>
                        {added.includes(u) ? "On timeline" : "Add to timeline"}
                      </button>
                    </div>
                  ))}
              </div>
            ))}
            <div ref={end} />
          </div>
          {error && <p className="aurora-agent-err">{error}</p>}
          <div className="aurora-agent-input">
            <textarea
              rows={2}
              value={input}
              placeholder="e.g. 15s drill teaser, rain in Port Harcourt, chrome title"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            {busy ? <button onClick={() => abort.current?.abort()}>Stop</button> : <button onClick={send} disabled={!input.trim()}>Send</button>}
          </div>
          <button className="aurora-agent-clear" onClick={() => setMsgs([])}>New conversation</button>
        </aside>
      )}
    </>
  );
}
