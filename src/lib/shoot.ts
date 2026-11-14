// Creates a project, uploads its files and starts the motion render.
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { getClientId } from "@/lib/client-id";

export type ShootFiles = Partial<Record<"performance" | "identity" | "outfit" | "scene" | "audio", File>>;

export async function startShoot(opts: {
  title: string;
  prompt: string;
  files: ShootFiles;
  aspectRatio: "9:16" | "16:9" | "1:1";
  duration: 5 | 10;
  soulId?: string | null;
}): Promise<string> {
  const clientId = getClientId();
  const { data: project, error } = await supabase
    .from("projects")
    .insert({ client_id: clientId, title: opts.title, status: "draft", scene_prompt: opts.prompt || null, enhanced_prompt: opts.prompt || null, soul_id: opts.soulId || null })
    .select("id")
    .single();
  if (error || !project) throw new Error(error?.message || "Could not create project");
  for (const [kind, file] of Object.entries(opts.files)) {
    if (!file) continue;
    const ext = file.name.split(".").pop() || "bin";
    const path = `${clientId}/${project.id}/${kind}.${ext}`;
    const up = await supabase.storage.from("uploads").upload(path, file, { contentType: file.type, upsert: true });
    if (up.error) throw new Error(`Upload ${kind}: ${up.error.message}`);
    const row = await supabase.from("project_assets").upsert({ project_id: project.id, client_id: clientId, kind, storage_path: path, mime_type: file.type }, { onConflict: "project_id,kind" });
    if (row.error) throw new Error(`Save ${kind}: ${row.error.message}`);
  }
  await api.startRender({ clientId, projectId: project.id, options: { duration: opts.duration, aspectRatio: opts.aspectRatio, motionStrength: 5, lipSync: false } });
  return project.id;
}
