import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getClientId } from "@/lib/client-id";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";
import { Fingerprint, Loader2, Sparkles, Trash2, Upload, X } from "lucide-react";

export type SoulListItem = { id: string; name: string; reference_image_paths: string[]; reference_profile: { description?: string } | null; cover_path: string | null };

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}
async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) }, body: JSON.stringify(body) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((j as { error?: string }).error || `HTTP ${res.status}`);
  return j as T;
}

export async function listSouls(): Promise<SoulListItem[]> {
  const { data } = await supabase.from("souls").select("id,name,reference_image_paths,reference_profile,cover_path").order("created_at", { ascending: false });
  return (data ?? []) as SoulListItem[];
}

export function useSoulCovers(souls: SoulListItem[]) {
  const [covers, setCovers] = useState<Record<string, string>>({});
  useEffect(() => {
    const paths = souls.map((s) => s.cover_path || s.reference_image_paths[0]).filter(Boolean) as string[];
    if (!paths.length) return;
    supabase.storage.from("souls").createSignedUrls(paths, 3600).then(({ data }) => {
      const map: Record<string, string> = {};
      souls.forEach((s) => { const p = s.cover_path || s.reference_image_paths[0]; const hit = data?.find((d) => d.path === p); if (hit?.signedUrl) map[s.id] = hit.signedUrl; });
      setCovers(map);
    });
  }, [souls]);
  return covers;
}

type Photo = { file: File; preview: string };

export default function Souls() {
  const [souls, setSouls] = useState<SoulListItem[]>([]);
  const [name, setName] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  const [testSoul, setTestSoul] = useState<string>("");
  const [testPrompt, setTestPrompt] = useState("Performing on a neon-lit rooftop at night, low angle, cinematic");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const covers = useSoulCovers(souls);

  const refresh = async () => { const s = await listSouls(); setSouls(s); if (!testSoul && s[0]) setTestSoul(s[0].id); };
  useEffect(() => { refresh(); }, []);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = Array.from(list).filter((f) => f.type.startsWith("image/")).map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setPhotos((p) => [...p, ...next].slice(0, 8));
  }

  async function create() {
    if (!name.trim()) { toast.error("Give your character a name"); return; }
    if (photos.length < 3) { toast.error("Add at least 3 clear photos of the same person"); return; }
    setBusy(true);
    const uid = getClientId();
    const paths: string[] = [];
    try {
      const id = crypto.randomUUID();
      for (let i = 0; i < photos.length; i++) {
        const f = photos[i].file;
        const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${uid}/${id}/${i}.${ext}`;
        const up = await supabase.storage.from("souls").upload(path, f, { upsert: true, contentType: f.type });
        if (up.error) throw new Error(up.error.message);
        paths.push(path);
      }
      const { error } = await supabase.from("souls").insert({ id, user_id: uid, name: name.trim(), reference_image_paths: paths, cover_path: paths[0] });
      if (error) throw new Error(error.message);
      toast.success("Character saved — writing identity notes…");
      setName(""); setPhotos([]);
      await refresh();
      setTestSoul(id);
      post("/api/soul/profile", { soulId: id }).then(refresh).catch(() => {});
    } catch (e) {
      if (paths.length) await supabase.storage.from("souls").remove(paths);
      toast.error(e instanceof Error ? e.message : "Could not save character");
    } finally { setBusy(false); }
  }

  async function remove(s: SoulListItem) {
    if (!confirm(`Delete ${s.name}?`)) return;
    await supabase.storage.from("souls").remove(s.reference_image_paths);
    await supabase.from("souls").delete().eq("id", s.id);
    refresh();
  }

  async function test() {
    if (!testSoul) return;
    setTesting(true); setResult(null);
    try { const r = await post<{ image: string }>("/api/soul/generate", { soulId: testSoul, prompt: testPrompt, aspectRatio: "9:16" }); setResult(r.image); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Generation failed"); }
    finally { setTesting(false); }
  }

  return <AppLayout><div className="mx-auto max-w-6xl space-y-8 px-5 py-8 text-foreground">
    <header>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary"><Fingerprint className="h-4 w-4" />Character lock</div>
      <h1 className="font-display text-6xl tracking-wide">Your <span className="text-primary">characters</span></h1>
      <p className="mt-2 max-w-2xl text-foreground/55">Save a person once from a few photos. Pick them on New shoot and every render keeps the same face, hair and build.</p>
    </header>

    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold">New character</h2>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. NBA Josh" className="w-full rounded-xl border border-border bg-foreground/5 px-4 py-3 text-sm outline-none" />
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-primary/30 p-8 text-center hover:border-primary/60">
          <Upload className="h-6 w-6 text-foreground/50" />
          <span className="text-sm font-medium">Add 3–8 photos of the same person</span>
          <span className="text-xs text-foreground/45">Clear face, different angles and lighting. No filters.</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
        </label>
        {photos.length > 0 && <div className="grid grid-cols-4 gap-2">{photos.map((p, i) => <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-border"><img src={p.preview} alt="" className="h-full w-full object-cover" /><button aria-label="Remove photo" onClick={() => setPhotos((x) => x.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded-full bg-background/80 p-1"><X className="h-3 w-3" /></button></div>)}</div>}
        <button onClick={create} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}Save character ({photos.length})</button>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold">Test the lock</h2>
        <select value={testSoul} onChange={(e) => setTestSoul(e.target.value)} className="w-full rounded-xl border border-border bg-foreground/5 px-4 py-3 text-sm">
          {souls.length === 0 && <option value="">Save a character first</option>}
          {souls.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <textarea value={testPrompt} onChange={(e) => setTestPrompt(e.target.value)} rows={3} className="w-full rounded-xl border border-border bg-foreground/5 px-4 py-3 text-sm outline-none" />
        <button onClick={test} disabled={testing || !testSoul} className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/50 px-4 py-3 text-sm font-semibold text-primary disabled:opacity-50">{testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Generate still</button>
        {result && <img src={result} alt="Character test" className="mx-auto max-h-[480px] rounded-xl border border-border" />}
      </section>
    </div>

    <section>
      <h2 className="mb-3 font-semibold">Saved characters</h2>
      {souls.length === 0 ? <p className="text-sm text-foreground/45">None yet.</p> :
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{souls.map((s) => <div key={s.id} className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="aspect-[4/3] bg-foreground/5">{covers[s.id] && <img src={covers[s.id]} alt={s.name} className="h-full w-full object-cover" />}</div>
          <div className="space-y-1 p-4">
            <div className="flex items-center justify-between"><span className="font-medium">{s.name}</span><button aria-label={`Delete ${s.name}`} onClick={() => remove(s)} className="text-foreground/40 hover:text-destructive"><Trash2 className="h-4 w-4" /></button></div>
            <div className="text-xs text-foreground/45">{s.reference_image_paths.length} photos</div>
            {s.reference_profile?.description && <p className="line-clamp-3 text-xs text-foreground/60">{s.reference_profile.description}</p>}
          </div>
        </div>)}</div>}
    </section>
  </div></AppLayout>;
}
