import { createFileRoute } from "@tanstack/react-router";
import {
  Clapperboard,
  Eraser,
  FileText,
  Image as ImageIcon,
  Loader2,
  Lock,
  Maximize2,
  Minus,
  Plus,
  Repeat,
  RotateCcw,
  UserRound,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AppShell } from "@/flow/components/app-shell";
import { CanvasAgentDock, editNodeImage, nodeImage } from "@/flow/components/canvas-agent-dock";
import { FrameImage } from "@/flow/components/frame";
import {
  DEMO_CANVAS_LINKS,
  DEMO_CANVAS_NODES,
  DEMO_CHARACTERS,
  type CanvasLink,
  type CanvasNode,
} from "@/flow/data/demo";
import { modelsOf, UPSCALE_LEVELS } from "@/flow/lib/model-registry";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/flow/canvas")({
  head: () => ({
    meta: [
      { title: "Canvas — Flowaurora" },
      {
        name: "description",
        content: "The node-based generation canvas: wire script, shots, characters and image outputs.",
      },
      { property: "og:title", content: "Canvas — Flowaurora" },
      { property: "og:description", content: "Your whole generation pipeline, wired on one node canvas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CanvasPage,
});

const NODE_W = 232;
const PORT_Y = 44;
const STORAGE_KEY = "flowaurora.canvas.v1";
const MIN_SCALE = 0.35;
const MAX_SCALE = 2.2;

type Viewport = { x: number; y: number; scale: number };

const KIND_META: Record<CanvasNode["kind"], { label: string; icon: LucideIcon; iconClass: string }> = {
  script: { label: "Script", icon: FileText, iconClass: "text-holo-amber" },
  shot: { label: "Shot", icon: Clapperboard, iconClass: "text-holo-cyan" },
  character: { label: "Character", icon: UserRound, iconClass: "text-holo-violet" },
  image: { label: "Image Output", icon: ImageIcon, iconClass: "text-holo-magenta" },
};

type DragState =
  | { mode: "pan"; startClientX: number; startClientY: number; startVx: number; startVy: number }
  | { mode: "node"; id: string; startClientX: number; startClientY: number; startX: number; startY: number }
  | null;

function initialNodes(): { nodes: CanvasNode[]; links: CanvasLink[] } {
  return { nodes: DEMO_CANVAS_NODES, links: DEMO_CANVAS_LINKS };
}

function loadCanvas(): { nodes: CanvasNode[]; links: CanvasLink[] } {
  if (typeof window === "undefined") return initialNodes();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.nodes) && Array.isArray(parsed.links)) return parsed;
    }
  } catch {
    // fall back to demo layout
  }
  return initialNodes();
}

function edgePath(from: CanvasNode, to: CanvasNode) {
  const x1 = from.x + NODE_W;
  const y1 = from.y + PORT_Y;
  const x2 = to.x;
  const y2 = to.y + PORT_Y;
  const dx = Math.max(48, Math.abs(x2 - x1) / 2);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

function CanvasNodeCard({
  node,
  selected,
  onPointerDown,
  onDelete,
}: {
  node: CanvasNode;
  selected: boolean;
  onPointerDown: (e: React.PointerEvent, node: CanvasNode) => void;
  onDelete: (id: string) => void;
}) {
  const meta = KIND_META[node.kind];
  return (
    <div
      data-node-id={node.id}
      onPointerDown={(e) => onPointerDown(e, node)}
      className={cn(
        "glass-strong group absolute w-[232px] cursor-grab touch-none select-none rounded-xl shadow-xl transition-shadow",
        selected && "ring-2 ring-holo-violet",
      )}
      style={{ left: node.x, top: node.y }}
    >
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onDelete(node.id)}
        aria-label={`Delete node ${node.title}`}
        className="absolute -right-2.5 -top-2.5 z-10 rounded-full bg-secondary p-1 text-muted-foreground opacity-0 shadow transition-opacity hover:text-destructive group-hover:opacity-100"
      >
        <Plus className="h-3 w-3 rotate-45" />
      </button>

      {/* Ports */}
      <span
        data-port="in"
        className="absolute -left-1.5 rounded-full border border-holo-violet/70 bg-background p-[3px]"
        style={{ top: PORT_Y - 5 }}
      >
        <span className="block h-1.5 w-1.5 rounded-full bg-holo-violet" />
      </span>
      <span
        data-port="out"
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute -right-1.5 cursor-crosshair rounded-full border border-holo-violet/70 bg-background p-[3px] hover:bg-holo-violet/30"
        style={{ top: PORT_Y - 5 }}
      >
        <span className="block h-1.5 w-1.5 rounded-full bg-holo-violet" />
      </span>

      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <meta.icon className={cn("h-3.5 w-3.5 shrink-0", meta.iconClass)} />
        <span className="font-head text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {meta.label}
        </span>
      </div>
      <div className="px-3 py-2.5">
        <p className="truncate font-head text-xs font-bold uppercase tracking-wide">{node.title}</p>
        <p className="truncate text-[11px] text-muted-foreground">{node.subtitle}</p>
        {node.imageUrl ? (
          <img src={node.imageUrl} alt={node.title} className="mt-2 aspect-video w-full rounded-md object-cover" draggable={false} />
        ) : (
          node.frame && <FrameImage frame={node.frame} className="mt-2 aspect-video rounded-md" />
        )}
        {node.lock?.length ? (
          <p className="mt-1.5 flex items-center gap-1 text-[10px] text-holo-cyan">
            <Lock className="h-2.5 w-2.5" /> Face lock · {node.lock.length}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ToolBtn({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="glass inline-flex items-center justify-center gap-1 rounded-md px-2 py-1.5 font-head text-[10px] font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function CanvasPage() {
  const [{ nodes, links }, setGraph] = useState(loadCanvas);
  const [viewport, setViewport] = useState<Viewport>({ x: 30, y: 30, scale: 0.72 });
  const [drag, setDrag] = useState<DragState>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [linking, setLinking] = useState<{ from: string; x: number; y: number } | null>(null);
  const [imageModel, setImageModel] = useState("openai/gpt-image-2.5-sunburst");
  const [videoModel, setVideoModel] = useState("google/gemini-omni-1.1-flash");
  const [swapChar, setSwapChar] = useState(DEMO_CHARACTERS[0]?.id ?? "");
  const [toolBusy, setToolBusy] = useState<string | null>(null);
  const [toolError, setToolError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, links }));
    } catch {
      // storage unavailable — canvas still works in memory
    }
  }, [nodes, links]);

  const toCanvas = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const { x, y, scale } = viewportRef.current;
    return { x: (clientX - rect.left - x) / scale, y: (clientY - rect.top - y) / scale };
  };

  // Global pointer handling for drags + linking
  useEffect(() => {
    if (!drag && !linking) return;

    const onMove = (e: PointerEvent) => {
      if (drag) {
        if (drag.mode === "pan") {
          setViewport((v) => ({
            ...v,
            x: drag.startVx + (e.clientX - drag.startClientX),
            y: drag.startVy + (e.clientY - drag.startClientY),
          }));
        } else {
          const scale = viewportRef.current.scale;
          setGraph((g) => ({
            ...g,
            nodes: g.nodes.map((n) =>
              n.id === drag.id
                ? {
                    ...n,
                    x: drag.startX + (e.clientX - drag.startClientX) / scale,
                    y: drag.startY + (e.clientY - drag.startClientY) / scale,
                  }
                : n,
            ),
          }));
        }
      } else if (linking) {
        const point = toCanvas(e.clientX, e.clientY);
        setLinking({ ...linking, x: point.x, y: point.y });
      }
    };

    const onUp = (e: PointerEvent) => {
      if (linking) {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const target = el?.closest("[data-node-id]")?.getAttribute("data-node-id");
        if (target && target !== linking.from) {
          setGraph((g) =>
            g.links.some((l) => l.from === linking.from && l.to === target)
              ? g
              : { ...g, links: [...g.links, { id: `l-${Date.now()}`, from: linking.from, to: target }] },
          );
        }
        setLinking(null);
      }
      setDrag(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [drag, linking]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setViewport((v) => {
      const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * (1 - e.deltaY * 0.0012)));
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const ratio = nextScale / v.scale;
      return { scale: nextScale, x: cx - (cx - v.x) * ratio, y: cy - (cy - v.y) * ratio };
    });
  };

  const startNodeDrag = (e: React.PointerEvent, node: CanvasNode) => {
    e.stopPropagation();
    setSelected(node.id);
    if ((e.target as HTMLElement).closest("[data-port='out']")) {
      const point = toCanvas(e.clientX, e.clientY);
      setLinking({ from: node.id, x: point.x, y: point.y });
      return;
    }
    setDrag({ mode: "node", id: node.id, startClientX: e.clientX, startClientY: e.clientY, startX: node.x, startY: node.y });
  };

  const startPan = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setSelected(null);
    setDrag({ mode: "pan", startClientX: e.clientX, startClientY: e.clientY, startVx: viewport.x, startVy: viewport.y });
  };

  const deleteNode = (id: string) => {
    setGraph((g) => ({
      nodes: g.nodes.filter((n) => n.id !== id),
      links: g.links.filter((l) => l.from !== id && l.to !== id),
    }));
    setSelected(null);
  };

  const addNode = (kind: CanvasNode["kind"]) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const center = rect
      ? toCanvas(rect.left + rect.width / 2, rect.top + rect.height / 2)
      : { x: 200, y: 200 };
    const defaults: Record<CanvasNode["kind"], { title: string; subtitle: string }> = {
      script: { title: "New Logline", subtitle: "Untitled draft" },
      shot: { title: "New Shot", subtitle: "Add camera notes" },
      character: { title: "New Character", subtitle: "Casting reference" },
      image: { title: "New Output", subtitle: "Prismatic Noir" },
    };
    const id = `n-${Date.now()}`;
    setGraph((g) => ({
      ...g,
      nodes: [
        ...g.nodes,
        {
          id,
          kind,
          title: defaults[kind].title,
          subtitle: defaults[kind].subtitle,
          x: Math.round(center.x - NODE_W / 2),
          y: Math.round(center.y - 40),
        },
      ],
    }));
    setSelected(id);
  };

  const fromNode = (id: string) => nodes.find((n) => n.id === id);

  const selectedNode = nodes.find((n) => n.id === selected);
  const selectedImage = selectedNode ? nodeImage(selectedNode) : undefined;

  const runEdit = async (label: string, sources: string[], prompt: string) => {
    if (!selectedNode) return;
    const id = selectedNode.id;
    setToolBusy(label);
    setToolError(null);
    try {
      await editNodeImage(sources, prompt, imageModel, (url) =>
        setGraph((g) => ({ ...g, nodes: g.nodes.map((n) => (n.id === id ? { ...n, imageUrl: url } : n)) })),
      );
    } catch (e) {
      setToolError(e instanceof Error ? e.message : `${label} failed`);
    } finally {
      setToolBusy(null);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-head text-xs font-semibold uppercase tracking-[0.25em] text-holo-amber">
              Generation Pipeline
            </p>
            <h1 className="mt-1 font-display text-3xl uppercase tracking-tight">Canvas</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(Object.keys(KIND_META) as CanvasNode["kind"][]).map((kind) => (
              <button
                key={kind}
                onClick={() => addNode(kind)}
                className="glass inline-flex items-center gap-1.5 rounded-lg px-3 py-2 font-head text-[11px] font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                {KIND_META[kind].label}
              </button>
            ))}
            <div className="glass flex items-center gap-1 rounded-lg px-1.5 py-1">
              <button
                aria-label="Zoom out"
                onClick={() => setViewport((v) => ({ ...v, scale: Math.max(MIN_SCALE, v.scale * 0.85) }))}
                className="rounded p-1.5 text-muted-foreground hover:text-foreground"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-12 text-center font-head text-xs font-semibold text-muted-foreground">
                {Math.round(viewport.scale * 100)}%
              </span>
              <button
                aria-label="Zoom in"
                onClick={() => setViewport((v) => ({ ...v, scale: Math.min(MAX_SCALE, v.scale * 1.15) }))}
                className="rounded p-1.5 text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                aria-label="Fit to view"
                onClick={() => setViewport({ x: 30, y: 30, scale: 0.72 })}
                className="rounded p-1.5 text-muted-foreground hover:text-foreground"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              onClick={() => {
                setGraph(initialNodes());
                setViewport({ x: 30, y: 30, scale: 0.72 });
              }}
              className="glass inline-flex items-center gap-1.5 rounded-lg px-3 py-2 font-head text-[11px] font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </header>

        <div
          ref={containerRef}
          onPointerDown={startPan}
          onWheel={onWheel}
          className="canvas-grid film-grain relative mt-4 h-[calc(100vh-220px)] min-h-[480px] cursor-grab touch-none overflow-hidden rounded-2xl border border-border active:cursor-grabbing"
        >
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})` }}
          >
            <svg
              className="pointer-events-none absolute overflow-visible"
              width={1}
              height={1}
              style={{ zIndex: 0 }}
            >
              <defs>
                <linearGradient id="edge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--holo-cyan)" />
                  <stop offset="100%" stopColor="var(--holo-violet)" />
                </linearGradient>
              </defs>
              {links.map((link) => {
                const from = fromNode(link.from);
                const to = fromNode(link.to);
                if (!from || !to) return null;
                return (
                  <g key={link.id} className="pointer-events-auto">
                    <path
                      d={edgePath(from, to)}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={16}
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setGraph((g) => ({ ...g, links: g.links.filter((l) => l.id !== link.id) }));
                      }}
                    />
                    <path
                      d={edgePath(from, to)}
                      fill="none"
                      stroke="url(#edge-grad)"
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      className="pointer-events-none opacity-80"
                    />
                  </g>
                );
              })}
              {linking &&
                (() => {
                  const from = fromNode(linking.from);
                  if (!from) return null;
                  return (
                    <path
                      d={`M ${from.x + NODE_W} ${from.y + PORT_Y} C ${from.x + NODE_W + 60} ${from.y + PORT_Y}, ${linking.x - 60} ${linking.y}, ${linking.x} ${linking.y}`}
                      fill="none"
                      stroke="var(--holo-magenta)"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      className="pointer-events-none"
                    />
                  );
                })()}
            </svg>

            {nodes.map((node) => (
              <CanvasNodeCard
                key={node.id}
                node={node}
                selected={selected === node.id}
                onPointerDown={startNodeDrag}
                onDelete={deleteNode}
              />
            ))}
          </div>

          {selectedNode && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="glass-strong absolute right-2 top-2 z-20 w-60 space-y-2 rounded-xl p-3 text-xs"
            >
              <p className="font-head text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Tools · {selectedNode.title}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {UPSCALE_LEVELS.map((u) => (
                  <ToolBtn key={u.id} disabled={!selectedImage || !!toolBusy} onClick={() => runEdit(`Upscale ${u.label}`, [selectedImage!], u.prompt)}>
                    <Wand2 className="h-3 w-3" /> {u.label}
                  </ToolBtn>
                ))}
                <ToolBtn
                  disabled={!selectedImage || !!toolBusy}
                  onClick={() => runEdit("Remove BG", [selectedImage!], "Remove the background completely; keep the subject pixel-perfect on a pure white background.")}
                >
                  <Eraser className="h-3 w-3" /> Remove BG
                </ToolBtn>
              </div>
              <div className="flex gap-1.5">
                <select
                  aria-label="Face swap character"
                  value={swapChar}
                  onChange={(e) => setSwapChar(e.target.value)}
                  className="min-w-0 flex-1 rounded-md border border-border bg-background px-1.5 py-1"
                >
                  {DEMO_CHARACTERS.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ToolBtn
                  disabled={!selectedImage || !!toolBusy}
                  onClick={() => {
                    const c = DEMO_CHARACTERS.find((x) => x.id === swapChar)!;
                    void runEdit(
                      "Face swap",
                      [selectedImage!, c.portrait],
                      `Face swap: replace the main person's face in the first image with the exact face and identity of the person in the second image. Keep pose, lighting, framing, wardrobe and background of the first image.`,
                    );
                  }}
                >
                  <Repeat className="h-3 w-3" /> Swap
                </ToolBtn>
              </div>
              <ToolBtn
                disabled={!!toolBusy}
                onClick={() => {
                  const ids = selectedNode.lock?.includes(swapChar)
                    ? selectedNode.lock.filter((i) => i !== swapChar)
                    : [...(selectedNode.lock ?? []), swapChar];
                  setGraph((g) => ({ ...g, nodes: g.nodes.map((n) => (n.id === selectedNode.id ? { ...n, lock: ids } : n)) }));
                }}
              >
                <Lock className="h-3 w-3" />
                {selectedNode.lock?.includes(swapChar) ? "Unlock" : "Lock"} face consistency
              </ToolBtn>
              {selectedNode.lock?.length ? (
                <p className="text-[10px] text-holo-cyan">
                  Locked: {selectedNode.lock.map((id) => DEMO_CHARACTERS.find((c) => c.id === id)?.name).join(", ")}
                </p>
              ) : null}
              {!selectedImage && <p className="text-[10px] text-muted-foreground">This node has no image yet — ask the agent to generate one.</p>}
              {toolBusy && <p className="flex items-center gap-1 text-holo-violet"><Loader2 className="h-3 w-3 animate-spin" /> {toolBusy}…</p>}
              {toolError && <p role="alert" className="text-destructive">{toolError}</p>}
            </div>
          )}

          <CanvasAgentDock graph={{ nodes, links }} setGraph={setGraph} imageModel={imageModel} />
        </div>
      </div>
      </div>
    </AppShell>
  );
}
