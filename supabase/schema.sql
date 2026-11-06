create extension if not exists pgcrypto;

create table if not exists public.platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.series (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  platform_id uuid not null references public.platforms (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (platform_id, name),
  unique (id, platform_id)
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null,
  series_id uuid not null,
  score integer not null check (score between 1 and 10),
  observation text not null default '',
  created_at timestamptz not null default now(),
  constraint ratings_series_platform_fkey
    foreign key (series_id, platform_id)
    references public.series (id, platform_id)
    on delete restrict
    on update cascade
);

create index if not exists series_platform_id_idx on public.series (platform_id);
create index if not exists ratings_series_id_idx on public.ratings (series_id);

alter table public.platforms enable row level security;
alter table public.series enable row level security;
alter table public.ratings enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete
  on public.platforms, public.series, public.ratings
  to anon, authenticated;

-- Public CRUD is enabled for the requested no-login version.
-- Do not use this policy for private or sensitive catalog data.
drop policy if exists "Public can manage platforms" on public.platforms;
drop policy if exists "Public can manage series" on public.series;
drop policy if exists "Public can manage ratings" on public.ratings;

create policy "Public can manage platforms"
  on public.platforms for all to anon, authenticated
  using (true) with check (true);

create policy "Public can manage series"
  on public.series for all to anon, authenticated
  using (true) with check (true);

create policy "Public can manage ratings"
  on public.ratings for all to anon, authenticated
  using (true) with check (true);
