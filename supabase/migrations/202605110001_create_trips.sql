create extension if not exists pgcrypto;

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  destination text not null check (char_length(destination) between 2 and 160),
  itinerary jsonb not null check (jsonb_typeof(itinerary) = 'object'),
  saved_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trips_user_saved_at_idx
  on public.trips (user_id, saved_at desc);

create index if not exists trips_destination_idx
  on public.trips (destination);

create index if not exists trips_itinerary_gin_idx
  on public.trips using gin (itinerary);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trips_set_updated_at on public.trips;

create trigger trips_set_updated_at
before update on public.trips
for each row
execute function public.set_updated_at();

alter table public.trips enable row level security;

drop policy if exists "Users can read their trips" on public.trips;
drop policy if exists "Users can insert their trips" on public.trips;
drop policy if exists "Users can update their trips" on public.trips;
drop policy if exists "Users can delete their trips" on public.trips;

create policy "Users can read their trips"
  on public.trips
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their trips"
  on public.trips
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their trips"
  on public.trips
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their trips"
  on public.trips
  for delete
  using (auth.uid() = user_id);
