-- 001_initial.sql
-- Tables: jobs, recipes
-- RLS enabled on both; users can only access their own rows.

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── updated_at helper ───────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── jobs ────────────────────────────────────────────────────────────────────
create table jobs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  status      text not null check (status in ('pending', 'processing', 'completed', 'failed')),
  url         text not null,
  recipe_id   uuid,                     -- populated once recipe is saved
  error       text,                     -- set on failure
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index jobs_user_id_idx  on jobs(user_id);
create index jobs_status_idx   on jobs(status);

create trigger jobs_updated_at
  before update on jobs
  for each row execute function set_updated_at();

alter table jobs enable row level security;

create policy "users read own jobs"
  on jobs for select
  using (auth.uid() = user_id);

create policy "users insert own jobs"
  on jobs for insert
  with check (auth.uid() = user_id);

create policy "users update own jobs"
  on jobs for update
  using (auth.uid() = user_id);

-- ─── recipes ─────────────────────────────────────────────────────────────────
create table recipes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  title           text not null,
  description     text,
  ingredients     jsonb not null default '[]',
  steps           jsonb not null default '[]',
  health_notes    text,
  source_url      text not null,
  thumbnail_url   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index recipes_user_id_idx on recipes(user_id);

create trigger recipes_updated_at
  before update on recipes
  for each row execute function set_updated_at();

alter table recipes enable row level security;

create policy "users read own recipes"
  on recipes for select
  using (auth.uid() = user_id);

create policy "users insert own recipes"
  on recipes for insert
  with check (auth.uid() = user_id);

create policy "users update own recipes"
  on recipes for update
  using (auth.uid() = user_id);

create policy "users delete own recipes"
  on recipes for delete
  using (auth.uid() = user_id);

-- ─── foreign key: jobs.recipe_id → recipes ───────────────────────────────────
alter table jobs
  add constraint jobs_recipe_id_fkey
  foreign key (recipe_id) references recipes(id) on delete set null;
