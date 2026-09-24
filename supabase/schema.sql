-- =========================================================
-- FutureTech.ai Login — database schema (Supabase / Postgres)
-- ---------------------------------------------------------
-- Paste this whole file into: Supabase → SQL Editor → New query → Run.
-- It is safe to run more than once.
--
-- What it creates:
--   1. public.profiles       one row per user (full name, avatar)
--   2. Row Level Security     a user can only read / update THEIR OWN row
--   3. handle_new_user()      trigger that creates the profile on sign-up
--   4. set_updated_at()       trigger that keeps updated_at current
--
-- There is deliberately NO insert or delete policy: profiles are created
-- only by the trigger, and deleted automatically with the auth user.
-- =========================================================


-- ---------- 1. Profiles table ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text check (char_length(full_name) <= 100),
  avatar_url  text check (char_length(avatar_url) <= 2048),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Public profile data for each auth user. Protected by RLS.';


-- ---------- 2. Row Level Security ----------
alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Table privileges (a second layer under RLS):
-- anonymous visitors get nothing; signed-in users may read, and may
-- change only full_name and avatar_url (never id or timestamps).
revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name, avatar_url) on table public.profiles to authenticated;


-- ---------- 3. Keep updated_at current ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();


-- ---------- 4. Create a profile for every new user ----------
-- security definer: runs with the owner's rights so it can insert even
-- though users have no insert policy. search_path = '' means every name
-- below is fully qualified, so nothing can be hijacked.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    left(
      nullif(
        trim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')),
        ''
      ),
      100
    ),
    left(
      coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
      2048
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger functions must not be callable through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();


-- ---------- 5. Profiles for users who signed up before this script ----------
insert into public.profiles (id, full_name)
select u.id, left(nullif(trim(coalesce(u.raw_user_meta_data ->> 'full_name', '')), ''), 100)
from auth.users as u
on conflict (id) do nothing;


-- ---------- Check (optional) ----------
-- After running, this should return one row: profiles | true
-- select tablename, rowsecurity from pg_tables where schemaname = 'public' and tablename = 'profiles';
