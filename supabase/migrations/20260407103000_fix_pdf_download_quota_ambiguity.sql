-- File: supabase/migrations/20260407103000_fix_pdf_download_quota_ambiguity.sql
-- Purpose: Repair the PDF quota RPCs so PL/pgSQL no longer treats `quota_date` as an ambiguous identifier.
-- Why it exists: the PDF export route depends on these RPCs, and the runtime 42702 error was blocking `/api/export/pdf`.
-- What it does: replaces the claim and rollback functions with fully-qualified table references and a `quota_day` return name, keeping the existing quota behavior intact.
-- Connected to: `supabase/migrations/20260406100000_add_pdf_download_limits.sql`, `src/features/pdf-download-limit/model/supabase-pdf-download-limit-repository.ts`, and `src/app/api/export/pdf/route.tsx`.

-- Resolve the PL/pgSQL name collision by dropping the old RPC signatures before recreating them with the new return type.
drop function if exists public.claim_pdf_download_quota(integer);
drop function if exists public.release_pdf_download_quota(integer);

create function public.claim_pdf_download_quota(p_daily_limit integer)
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
    where quota_ledger.quota_date = current_quota_date
      and quota_ledger.download_count < p_daily_limit
  returning download_count into next_download_count;

  if not found then
    select q.download_count
      into next_download_count
    from public.pdf_download_quotas as q
    where q.user_id = current_user_id
      and q.quota_date = current_quota_date;

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

-- Keep the rollback path consistent with the claim path so failed exports can safely release one reserved slot.
create function public.release_pdf_download_quota(p_daily_limit integer)
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
    select q.download_count
      into next_download_count
    from public.pdf_download_quotas as q
    where q.user_id = current_user_id
      and q.quota_date = current_quota_date;

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

grant execute on function public.claim_pdf_download_quota(integer) to authenticated;
grant execute on function public.release_pdf_download_quota(integer) to authenticated;
