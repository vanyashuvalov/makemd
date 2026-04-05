-- File: supabase/migrations/20260405195000_init.sql
-- Purpose: Initial Supabase database bootstrap for authentication, document metadata, RLS, and private markdown storage.
-- Why it exists: the app needs one repeatable SQL starting point that wires user profiles, user-owned documents, and storage policies before the frontend starts syncing drafts to the cloud.
-- What it does: creates the base tables, auth triggers, row-level security policies, and a private storage bucket for user-owned `.md` files.
-- Connected to: Supabase Auth, Supabase Storage, the workspace persistence layer, and the future cloud-sync adapter.

-- IMPORTANT:
-- Google and Telegram provider configuration is done in the Supabase Auth dashboard or project settings, not in SQL.
-- This migration prepares the database-side auth model, profile mirroring, and file-level access control that those providers will use after sign-in.

-- Keep the minimum extension set required for UUID generation and trigger-backed defaults.
create extension if not exists pgcrypto;

-- Use one reusable timestamp trigger for every table that needs an updated_at column.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- Mirror auth.users into a lightweight public profile row so the app can read display data without reaching into the auth schema from client code.
create or replace function public.sync_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_email text := nullif(lower(trim(coalesce(new.email, ''))), '');
  next_display_name text := nullif(
    trim(
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
        nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
        nullif(trim(new.raw_user_meta_data ->> 'preferred_username'), ''),
        nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
        'User'
      )
    ),
    ''
  );
  next_avatar_url text := nullif(
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    ),
    ''
  );
  next_auth_provider text := coalesce(new.raw_app_meta_data ->> 'provider', 'email');
begin
  insert into public.profiles (id, email, display_name, avatar_url, auth_provider)
  values (new.id, next_email, next_display_name, next_avatar_url, next_auth_provider)
  on conflict (id) do update
    set email = excluded.email,
        display_name = excluded.display_name,
        avatar_url = excluded.avatar_url,
        auth_provider = excluded.auth_provider,
        updated_at = timezone('utc', now());

  return new;
end;
$$;

-- Create a stable file path for each document so the metadata row and the storage object always point at the same user-owned markdown asset.
create or replace function public.assign_document_storage_path()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.storage_path is null or new.storage_path = '' then
    new.storage_path := new.user_id::text || '/documents/' || new.id::text || '.md';
  end if;

  return new;
end;
$$;

-- Store one profile per auth user and keep it available for client-side reads and later account settings screens.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  auth_provider text not null default 'email',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists profiles_email_idx on public.profiles (email);

-- Store document metadata separately from the markdown file body so the app can list, rename, and sort documents without downloading every file first.
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  storage_path text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists documents_user_id_updated_at_idx on public.documents (user_id, updated_at desc);
create index if not exists documents_user_id_created_at_idx on public.documents (user_id, created_at desc);

-- Keep timestamps fresh on both tables so the client can rely on updated_at for sorting and sync decisions.
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_documents_updated_at on public.documents;
create trigger set_documents_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

-- Fill the storage path automatically when the app inserts a new document row.
drop trigger if exists assign_document_storage_path_before_insert on public.documents;
create trigger assign_document_storage_path_before_insert
before insert on public.documents
for each row execute function public.assign_document_storage_path();

-- Keep the public profile row synchronized whenever a Supabase auth user is created or their visible metadata changes.
drop trigger if exists sync_auth_user_profile_on_insert on auth.users;
create trigger sync_auth_user_profile_on_insert
after insert on auth.users
for each row execute function public.sync_auth_user_profile();

drop trigger if exists sync_auth_user_profile_on_update on auth.users;
create trigger sync_auth_user_profile_on_update
after update of email, raw_user_meta_data, raw_app_meta_data on auth.users
for each row execute function public.sync_auth_user_profile();

-- Turn on RLS for the app-owned tables before defining policies so only the signed-in owner can read or mutate their data.
alter table public.profiles enable row level security;
alter table public.documents enable row level security;

-- Profiles: users can read and manage only their own profile row.
drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Users can delete their own profile" on public.profiles;
create policy "Users can delete their own profile"
on public.profiles
for delete
to authenticated
using ((select auth.uid()) = id);

-- Documents: every signed-in user owns their own document metadata rows and can only see or modify their own files.
drop policy if exists "Users can read their own documents" on public.documents;
create policy "Users can read their own documents"
on public.documents
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own documents" on public.documents;
create policy "Users can insert their own documents"
on public.documents
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own documents" on public.documents;
create policy "Users can update their own documents"
on public.documents
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own documents" on public.documents;
create policy "Users can delete their own documents"
on public.documents
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Create a private bucket for markdown bodies so each user can keep the raw .md file in storage while the public.documents table stores searchable metadata.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'markdown-files',
  'markdown-files',
  false,
  5 * 1024 * 1024,
  array['text/markdown', 'text/plain']::text[]
)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Storage objects: users may upload, read, update, and delete only the markdown files that live under their own user folder.
drop policy if exists "Users can read their own markdown files" on storage.objects;
create policy "Users can read their own markdown files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'markdown-files'
  and owner_id = (select auth.uid()::text)
);

drop policy if exists "Users can upload their own markdown files" on storage.objects;
create policy "Users can upload their own markdown files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'markdown-files'
  and storage.extension(name) = 'md'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Users can update their own markdown files" on storage.objects;
create policy "Users can update their own markdown files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'markdown-files'
  and owner_id = (select auth.uid()::text)
)
with check (
  bucket_id = 'markdown-files'
  and storage.extension(name) = 'md'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Users can delete their own markdown files" on storage.objects;
create policy "Users can delete their own markdown files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'markdown-files'
  and owner_id = (select auth.uid()::text)
);
