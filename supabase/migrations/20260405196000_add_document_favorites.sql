-- File: supabase/migrations/20260405196000_add_document_favorites.sql
-- Purpose: Add a user-owned favorites collection for reusable markdown snapshots.
-- Why it exists: favorites are not documents themselves, so they need a separate table, RLS policy set, and stable deduplication rule.
-- What it does: creates the favorites table, updates timestamps, and exposes authenticated-only access so the sidebar can save and load reusable snapshots.
-- Connected to: Supabase Auth, the favorites sidebar tab, the document row context menu, and the future "create document from favorite" flow.

-- Store reusable markdown snapshots separately from documents so favorites can evolve independently from the user's live document history.
create table if not exists public.document_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  markdown text not null,
  content_hash text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, content_hash)
);

create index if not exists document_favorites_user_id_updated_at_idx
  on public.document_favorites (user_id, updated_at desc);

-- Keep favorites timestamps fresh so the cloud repository can sort them by the last time the snapshot changed.
drop trigger if exists set_document_favorites_updated_at on public.document_favorites;
create trigger set_document_favorites_updated_at
before update on public.document_favorites
for each row execute function public.set_updated_at();

-- Turn on RLS before defining policies so only the signed-in owner can read or mutate their favorites collection.
alter table public.document_favorites enable row level security;

-- Favorites: users can read, create, update, and delete only their own reusable snapshot cards.
drop policy if exists "Users can read their own favorites" on public.document_favorites;
create policy "Users can read their own favorites"
on public.document_favorites
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own favorites" on public.document_favorites;
create policy "Users can insert their own favorites"
on public.document_favorites
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own favorites" on public.document_favorites;
create policy "Users can update their own favorites"
on public.document_favorites
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own favorites" on public.document_favorites;
create policy "Users can delete their own favorites"
on public.document_favorites
for delete
to authenticated
using ((select auth.uid()) = user_id);
