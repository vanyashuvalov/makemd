-- File: supabase/migrations/20260406100000_add_pdf_download_limits.sql
-- Purpose: Daily PDF download quota storage for authenticated workspace users.
-- Why it exists: the export route needs a persistent, server-enforced counter so signed-in users cannot bypass the 50-per-day cap by refreshing or opening new tabs.
-- What it does: creates a per-user, per-day counter table plus atomic claim and rollback functions that the App Router export route can call through the existing Supabase session.
-- Connected to: `src/app/api/export/pdf/route.tsx`, `src/features/pdf-download-limit/model/supabase-pdf-download-limit-repository.ts`, and the shared PDF export flow.

-- Store one quota row per user and UTC day so the counter remains stable across multiple requests without leaking into the browser state.
create table if not exists public.pdf_download_quotas (
  user_id uuid not null references auth.users(id) on delete cascade,
  quota_date date not null,
  download_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, quota_date)
);

create index if not exists pdf_download_quotas_user_id_quota_date_idx
  on public.pdf_download_quotas (user_id, quota_date desc);

drop trigger if exists set_pdf_download_quotas_updated_at on public.pdf_download_quotas;
create trigger set_pdf_download_quotas_updated_at
before update on public.pdf_download_quotas
for each row execute function public.set_updated_at();

-- Keep the quota table private; the route only needs the RPC surface, not direct table access from the client.
revoke all on table public.pdf_download_quotas from anon, authenticated, public;

-- Claim one PDF download slot for the current authenticated user if the daily cap has not been reached yet, returning the UTC day as `quota_day` to avoid PL/pgSQL name collisions.
create or replace function public.claim_pdf_download_quota(p_daily_limit integer)
returns table (
  allowed boolean,
  used_count integer,
  daily_limit integer,
  remaining_count integer,
  quota_day date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_quota_date date := timezone('utc', now())::date;
  next_download_count integer;
begin
  if current_user_id is null then
    return query
      select false, 0, p_daily_limit, p_daily_limit, current_quota_date;
    return;
  end if;

  insert into public.pdf_download_quotas as quota_ledger (user_id, quota_date, download_count)
  values (current_user_id, current_quota_date, 1)
  on conflict (user_id, quota_date) do update
    set download_count = quota_ledger.download_count + 1
    where quota_ledger.download_count < p_daily_limit
  returning download_count into next_download_count;

  if not found then
    select pdf_download_quotas.download_count
      into next_download_count
    from public.pdf_download_quotas
    where user_id = current_user_id
      and quota_date = current_quota_date;

    return query
      select false,
        coalesce(next_download_count, 0),
        p_daily_limit,
        greatest(p_daily_limit - coalesce(next_download_count, 0), 0),
        current_quota_date;
    return;
  end if;

  return query
    select true,
      next_download_count,
      p_daily_limit,
      greatest(p_daily_limit - next_download_count, 0),
      current_quota_date;
end;
$$;

-- Roll back one claimed PDF download slot if the export fails after the quota was already reserved, using the same `quota_day` output name as the claim function.
create or replace function public.release_pdf_download_quota(p_daily_limit integer)
returns table (
  allowed boolean,
  used_count integer,
  daily_limit integer,
  remaining_count integer,
  quota_day date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_quota_date date := timezone('utc', now())::date;
  next_download_count integer;
begin
  if current_user_id is null then
    return query
      select false, 0, p_daily_limit, p_daily_limit, current_quota_date;
    return;
  end if;

  update public.pdf_download_quotas as quota_ledger
    set download_count = greatest(quota_ledger.download_count - 1, 0)
    where quota_ledger.user_id = current_user_id
      and quota_ledger.quota_date = current_quota_date
      and quota_ledger.download_count > 0
  returning quota_ledger.download_count into next_download_count;

  if not found then
    select pdf_download_quotas.download_count
      into next_download_count
    from public.pdf_download_quotas
    where user_id = current_user_id
      and quota_date = current_quota_date;

    return query
      select true,
        coalesce(next_download_count, 0),
        p_daily_limit,
        greatest(p_daily_limit - coalesce(next_download_count, 0), 0),
        current_quota_date;
    return;
  end if;

  return query
    select true,
      next_download_count,
      p_daily_limit,
      greatest(p_daily_limit - next_download_count, 0),
      current_quota_date;
end;
$$;

revoke all on function public.claim_pdf_download_quota(integer) from public;
revoke all on function public.release_pdf_download_quota(integer) from public;
grant execute on function public.claim_pdf_download_quota(integer) to authenticated;
grant execute on function public.release_pdf_download_quota(integer) to authenticated;
