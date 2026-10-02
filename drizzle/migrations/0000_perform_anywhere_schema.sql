-- Perform Anywhere schema (ported from the original api-server migrations)
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.projects (
  id              uuid primary key default gen_random_uuid(),
  client_id       text not null,
  title           text,
  status          text not null default 'draft',
  provider        text,
  selected_model  text,
  output_path     text,
  enhanced_prompt text,
  scene_prompt    text,
  style_prompt    text,
  error_message   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists projects_client_id_idx on public.projects (client_id);
drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

create table if not exists public.project_assets (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  client_id    text,
  kind         text not null,
  storage_path text not null,
  mime_type    text,
  created_at   timestamptz not null default now(),
  unique (project_id, kind)
);
create index if not exists project_assets_project_id_idx on public.project_assets (project_id);

create table if not exists public.project_renders (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects (id) on delete cascade,
  client_id        text,
  provider         text,
  status           text not null default 'queued',
  prompt           text,
  output_path      text,
  provider_task_id text,
  is_lip_sync      boolean not null default false,
  is_omnihuman     boolean not null default false,
  error_message    text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists project_renders_project_id_idx on public.project_renders (project_id);
drop trigger if exists project_renders_set_updated_at on public.project_renders;
create trigger project_renders_set_updated_at before update on public.project_renders
  for each row execute function public.set_updated_at();

create table if not exists public.generations (
  id            uuid primary key default gen_random_uuid(),
  client_id     text not null,
  modality      text,
  model         text,
  provider      text,
  prompt        text,
  options       jsonb not null default '{}'::jsonb,
  credits_used  numeric not null default 0,
  status        text not null default 'running',
  output_text   text,
  output_url    text,
  duration_ms   integer,
  error_message text,
  created_at    timestamptz not null default now()
);
create index if not exists generations_client_id_idx on public.generations (client_id);

create table if not exists public.credit_wallets (
  client_id          text primary key,
  balance            numeric not null default 0,
  lifetime_purchased numeric not null default 0,
  lifetime_spent     numeric not null default 0,
  updated_at         timestamptz not null default now()
);
drop trigger if exists credit_wallets_set_updated_at on public.credit_wallets;
create trigger credit_wallets_set_updated_at before update on public.credit_wallets
  for each row execute function public.set_updated_at();

create table if not exists public.purchases (
  id                 uuid primary key default gen_random_uuid(),
  client_id          text not null,
  paystack_reference text unique,
  amount_paid_minor  bigint,
  currency           text default 'NGN',
  credits_allocated  numeric,
  raw_event          jsonb,
  created_at         timestamptz not null default now()
);

create table if not exists public.credit_ledger (
  id            uuid primary key default gen_random_uuid(),
  client_id     text not null,
  amount        numeric not null,
  reason        text,
  description   text,
  generation_id uuid,
  purchase_id   uuid,
  created_at    timestamptz not null default now()
);

create or replace function public.grant_credits(
  _client_id text, _amount numeric, _reason text, _description text, _purchase_id uuid
) returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.credit_wallets (client_id, balance, lifetime_purchased)
  values (_client_id, _amount, case when _reason = 'purchase' then _amount else 0 end)
  on conflict (client_id) do update
    set balance = public.credit_wallets.balance + _amount,
        lifetime_purchased = public.credit_wallets.lifetime_purchased
          + (case when _reason = 'purchase' then _amount else 0 end),
        updated_at = now();
  insert into public.credit_ledger (client_id, amount, reason, description, purchase_id)
  values (_client_id, _amount, _reason, _description, _purchase_id);
end;
$$;

create or replace function public.spend_credits(
  _client_id text, _amount numeric, _reason text, _description text, _generation_id uuid
) returns void language plpgsql security definer set search_path = public as $$
declare
  cur numeric;
begin
  select balance into cur from public.credit_wallets where client_id = _client_id for update;
  if cur is null or cur < _amount then
    raise exception 'insufficient_credits';
  end if;
  update public.credit_wallets
    set balance = balance - _amount,
        lifetime_spent = lifetime_spent + _amount,
        updated_at = now()
    where client_id = _client_id;
  insert into public.credit_ledger (client_id, amount, reason, description, generation_id)
  values (_client_id, -_amount, _reason, _description, _generation_id);
end;
$$;

-- Identity model: no login; each browser scopes its data by random client_id
-- (original app design), so policies are intentionally client-scoped-by-app.
do $$
declare t text;
begin
  foreach t in array array[
    'projects','project_assets','project_renders',
    'generations','credit_wallets','purchases','credit_ledger'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists client_all_%I on public.%I;', t, t);
    execute format(
      'create policy client_all_%I on public.%I for all to anon, authenticated using (true) with check (true);',
      t, t
    );
  end loop;
end;
$$;

grant usage on schema public to anon, authenticated;
grant all on public.projects, public.project_assets, public.project_renders,
  public.generations, public.credit_wallets, public.purchases, public.credit_ledger
  to anon, authenticated, service_role;
grant execute on function public.grant_credits(text, numeric, text, text, uuid) to anon, authenticated, service_role;
grant execute on function public.spend_credits(text, numeric, text, text, uuid) to anon, authenticated, service_role;
grant execute on function public.set_updated_at() to anon, authenticated, service_role;