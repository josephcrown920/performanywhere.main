CREATE TABLE IF NOT EXISTS public.souls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'ready',
  identity_mode text NOT NULL DEFAULT 'reference',
  reference_image_paths text[] NOT NULL DEFAULT '{}',
  reference_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  cover_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.souls TO authenticated;
GRANT ALL ON public.souls TO service_role;
ALTER TABLE public.souls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "souls owner select" ON public.souls FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "souls owner insert" ON public.souls FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "souls owner update" ON public.souls FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "souls owner delete" ON public.souls FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS souls_user_idx ON public.souls(user_id, created_at DESC);

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS soul_id uuid;

CREATE POLICY "souls bucket owner read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'souls' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "souls bucket owner write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'souls' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "souls bucket owner delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'souls' AND (storage.foldername(name))[1] = auth.uid()::text);