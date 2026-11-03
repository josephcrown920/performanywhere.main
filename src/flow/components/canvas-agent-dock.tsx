import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { ChevronDown, ChevronUp, Loader2, Send, Sparkles, Square } from "lucide-react";
import { useRef, useState } from "react";

import {
  DEMO_CHARACTERS,
  DEMO_PROJECT,
  FRAME_IMAGES,
  type CanvasLink,
  type CanvasNode,
} from "@/flow/data/demo";
import { modelsOf } from "@/flow/lib/model-registry";
import { streamImage } from "@/flow/lib/stream-image";
import { cn } from "@/lib/utils";

type Graph = { nodes: CanvasNode[]; links: CanvasLink[] };

async function toBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  return res.blob();
}

/** Run an image edit (upscale, face swap, background removal, locked generation). */
export async function editNodeImage(
  sources: string[],
  prompt: string,
  model: string,
  onFrame: (url: string) => void,
) {
  const form = new FormData();
  for (const [i, src] of sources.entries()) form.append("image[]", await toBlob(src), `ref-${i}.png`);
  form.set("prompt", prompt);
  form.set("model", model);
  await streamImage("/api/fl/edit-image", form, (url) => onFrame(url));
}

export function nodeImage(node: CanvasNode): string | undefined {
  return node.imageUrl ?? (node.frame ? FRAME_IMAGES[node.frame] : undefined);
}

export function CanvasAgentDock({
  graph,
  setGraph,
  imageModel,
}: {
  graph: Graph;
  setGraph: (fn: (g: Graph) => Graph) => void;
  imageModel: string;
}) {
  const [open, setOpen] = useState(true);
  const [input, setInput] = useState("");
  const [chatModel, setChatModel] = useState("openai/gpt-6-astra");
  const graphRef = useRef(graph);
  graphRef.current = graph;

  const patchNode = (id: string, patch: Partial<CanvasNode>) =>
    setGraph((g) => ({ ...g, nodes: g.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) }));

  const runTool = async (name: string, args: Record<string, unknown>): Promise<string> => {
    const g = graphRef.current;
    const find = (id: unknown) => {
      const n = g.nodes.find((x) => x.id === id);
      if (!n) throw new Error(`No node with id ${String(id)}`);
      return n;
    };
    switch (name) {
      case "add_node": {
        const id = `n-${Date.now()}-${Math.round(Math.random() * 1e4)}`;
        const maxX = Math.max(0, ...g.nodes.map((n) => n.x));
        setGraph((gr) => ({
          ...gr,
          nodes: [
            ...gr.nodes,
            {
              id,
              kind: args.kind as CanvasNode["kind"],
              title: String(args.title ?? "New node"),
              subtitle: String(args.subtitle ?? ""),
              x: maxX + 280,
              y: 40 + (gr.nodes.length % 5) * 150,
            },
          ],
        }));
        return `Added node ${id}`;
      }
      case "delete_node":
        find(args.nodeId);
        setGraph((gr) => ({
          nodes: gr.nodes.filter((n) => n.id !== args.nodeId),
          links: gr.links.filter((l) => l.from !== args.nodeId && l.to !== args.nodeId),
        }));
        return "Deleted";
      case "set_node": {
        find(args.nodeId);
        const patch: Partial<CanvasNode> = {};
        if (typeof args.title === "string") patch.title = args.title;
        if (typeof args.subtitle === "string") patch.subtitle = args.subtitle;
        if (typeof args.prompt === "string") patch.prompt = args.prompt;
        patchNode(String(args.nodeId), patch);
        return "Updated";
      }
      case "connect_nodes":
        find(args.fromId);
        find(args.toId);
        setGraph((gr) => ({
          ...gr,
          links: [...gr.links, { id: `l-${Date.now()}`, from: String(args.fromId), to: String(args.toId) }],
        }));
        return "Connected";
      case "cut_link":
        setGraph((gr) => ({ ...gr, links: gr.links.filter((l) => l.id !== args.linkId) }));
        return "Link removed";
      case "lock_character": {
        find(args.nodeId);
        const ids = (args.characterIds as string[]).filter((id) => DEMO_CHARACTERS.some((c) => c.id === id));
        patchNode(String(args.nodeId), { lock: ids });
        return `Locked ${ids.length} character(s)`;
      }
      case "generate_image_node": {
        const node = find(args.nodeId);
        const prompt = String(args.prompt);
        await streamImage(
          "/api/fl/generate-image",
          { prompt, model: (args.model as string) || imageModel },
          (url) => patchNode(node.id, { imageUrl: url, prompt }),
        );
        return "Image generated";
      }
      case "generate_locked_image": {
        const node = find(args.nodeId);
        const refs = DEMO_CHARACTERS.filter((c) => node.lock?.includes(c.id)).map((c) => c.portrait);
        if (refs.length === 0) throw new Error("Node has no locked characters");
        const prompt = `${String(args.prompt)}\nKeep each reference person's exact face, identity, hair and wardrobe. Same faces in every frame.`;
        await editNodeImage(refs, prompt, (args.model as string) || imageModel, (url) =>
          patchNode(node.id, { imageUrl: url, prompt: String(args.prompt) }),
        );
        return "Locked image generated";
      }
      default:
        throw new Error(`Unknown tool ${name}`);
    }
  };

  const { messages, sendMessage, status, stop, addToolOutput, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/fl/canvas-agent",
      body: () => ({
        chatModel,
        context: {
          project: DEMO_PROJECT,
          nodes: graphRef.current.nodes.map((n) => ({
            id: n.id,
            kind: n.kind,
            title: n.title,
            subtitle: n.subtitle,
            prompt: n.prompt,
            lock: n.lock,
            hasImage: Boolean(nodeImage(n)),
          })),
          links: graphRef.current.links,
          characters: DEMO_CHARACTERS.map((c) => ({
            id: c.id,
            name: c.name,
            role: c.role,
            description: c.description,
            tags: c.tags,
          })),
        },
      }),
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) return;
      if (toolCall.toolName === "optimize_prompt" || toolCall.toolName === "list_models") return;
      try {
        const output = await runTool(toolCall.toolName, toolCall.input as Record<string, unknown>);
        addToolOutput({ tool: toolCall.toolName as never, toolCallId: toolCall.toolCallId, output: output as never });
      } catch (e) {
        addToolOutput({
          tool: toolCall.toolName as never,
          toolCallId: toolCall.toolCallId,
          state: "output-error",
          errorText: e instanceof Error ? e.message : "Tool failed",
        } as never);
      }
    },
  });

  const busy = status === "submitted" || status === "streaming";
  const submit = () => {
    if (!input.trim() || busy) return;
    void sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="glass-strong absolute inset-x-2 bottom-2 z-20 rounded-xl shadow-2xl" onPointerDown={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Sparkles className="h-4 w-4 text-holo-violet" />
        <span className="font-head text-[11px] font-bold uppercase tracking-wider">Studio Agent</span>
        <select
          aria-label="Agent model"
          value={chatModel}
          onChange={(e) => setChatModel(e.target.value)}
          className="ml-auto max-w-[45%] rounded-md border border-border bg-background px-2 py-1 text-[11px]"
        >
          {modelsOf("chat").map((m) => (
            <option key={m.id} value={m.id} disabled={m.status === "locked"} title={m.note}>
              {m.label}
              {m.status === "locked" ? " (locked)" : ""}
            </option>
          ))}
        </select>
        <button aria-label={open ? "Collapse agent" : "Expand agent"} onClick={() => setOpen(!open)} className="rounded p-1 text-muted-foreground hover:text-foreground">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>
      {open && (
        <div className="max-h-48 space-y-2 overflow-y-auto px-3 py-2 text-xs">
          {messages.length === 0 && (
            <p className="text-muted-foreground">
              Give me a brief — e.g. "Lock Kira, add 3 rooftop shots and generate frames with consistent faces."
            </p>
          )}
          {messages.map((m) => (
            <div key={m.id} className={cn(m.role === "user" ? "text-foreground" : "text-muted-foreground")}>
              {m.parts.map((p, i) =>
                p.type === "text" ? (
                  <p key={i} className="whitespace-pre-wrap">
                    <span className="font-head font-bold uppercase">{m.role === "user" ? "You: " : "Agent: "}</span>
                    {p.text}
                  </p>
                ) : p.type.startsWith("tool-") ? (
                  <p key={i} className="text-[10px] text-holo-cyan">⚙ {p.type.slice(5)}</p>
                ) : null,
              )}
            </div>
          ))}
          {error && <p role="alert" className="text-destructive">{error.message}</p>}
        </div>
      )}
      <form
        className="flex items-center gap-2 px-3 pb-2.5 pt-1"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell the agent what to create…"
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        {busy ? (
          <button type="button" aria-label="Stop agent" onClick={() => void stop()} className="rounded-lg bg-secondary p-2">
            {status === "submitted" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
          </button>
        ) : (
          <button type="submit" aria-label="Send to agent" className="rounded-lg bg-primary p-2 text-primary-foreground">
            <Send className="h-4 w-4" />
          </button>
        )}
      </form>
    </div>
  );
}
