-- Data now belongs to signed-in users: client_id holds the user's id.
DROP POLICY IF EXISTS client_all_projects ON public.projects;
DROP POLICY IF EXISTS client_all_project_assets ON public.project_assets;
DROP POLICY IF EXISTS client_all_project_renders ON public.project_renders;
DROP POLICY IF EXISTS client_all_generations ON public.generations;
DROP POLICY IF EXISTS client_all_credit_wallets ON public.credit_wallets;
DROP POLICY IF EXISTS client_all_credit_ledger ON public.credit_ledger;
DROP POLICY IF EXISTS client_all_purchases ON public.purchases;

REVOKE ALL ON public.projects, public.project_assets, public.project_renders, public.generations,
  public.credit_wallets, public.credit_ledger, public.purchases FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects, public.project_assets, public.project_renders, public.generations TO authenticated;
GRANT SELECT ON public.credit_wallets, public.credit_ledger, public.purchases TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.credit_wallets, public.credit_ledger, public.purchases FROM authenticated;
GRANT ALL ON public.projects, public.project_assets, public.project_renders, public.generations,
  public.credit_wallets, public.credit_ledger, public.purchases TO service_role;

CREATE POLICY own_projects ON public.projects FOR ALL TO authenticated
  USING (client_id = (auth.uid())::text) WITH CHECK (client_id = (auth.uid())::text);
CREATE POLICY own_project_assets ON public.project_assets FOR ALL TO authenticated
  USING (client_id = (auth.uid())::text) WITH CHECK (client_id = (auth.uid())::text);
CREATE POLICY own_project_renders ON public.project_renders FOR ALL TO authenticated
  USING (client_id = (auth.uid())::text) WITH CHECK (client_id = (auth.uid())::text);
CREATE POLICY own_generations ON public.generations FOR ALL TO authenticated
  USING (client_id = (auth.uid())::text) WITH CHECK (client_id = (auth.uid())::text);
CREATE POLICY own_credit_wallets ON public.credit_wallets FOR SELECT TO authenticated
  USING (client_id = (auth.uid())::text);
CREATE POLICY own_credit_ledger ON public.credit_ledger FOR SELECT TO authenticated
  USING (client_id = (auth.uid())::text);
CREATE POLICY own_purchases ON public.purchases FOR SELECT TO authenticated
  USING (client_id = (auth.uid())::text);

-- Credits can only be changed by the server.
REVOKE EXECUTE ON FUNCTION public.grant_credits(text, numeric, text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.spend_credits(text, numeric, text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_credits(text, numeric, text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.spend_credits(text, numeric, text, text, uuid) TO service_role;

-- Files: each user only touches their own folder.
DROP POLICY IF EXISTS client_storage_uploads_renders ON storage.objects;
CREATE POLICY own_storage_uploads_renders ON storage.objects FOR ALL TO authenticated
  USING (bucket_id IN ('uploads', 'renders') AND (storage.foldername(name))[1] = (auth.uid())::text)
  WITH CHECK (bucket_id IN ('uploads', 'renders') AND (storage.foldername(name))[1] = (auth.uid())::text);