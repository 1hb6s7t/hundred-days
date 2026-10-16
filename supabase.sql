-- Run once in your own Supabase project's SQL Editor.
-- One field per row: concurrent edits to different fields never overwrite each other.
create table if not exists public.hundred_cells (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null check (key ~ '^(settings/(start|route|level)|day/([1-9]|[1-9][0-9]|100)/[a-zA-Z0-9_-]+)$'),
  value jsonb not null,
  at bigint not null check (at >= 0),
  device text not null check (length(device) <= 100),
  primary key (user_id, key)
);
alter table public.hundred_cells enable row level security;
revoke all on public.hundred_cells from anon;
grant select, insert, update on public.hundred_cells to authenticated;
create policy "hundred_read_own" on public.hundred_cells for select to authenticated using ((select auth.uid()) = user_id);
create policy "hundred_insert_own" on public.hundred_cells for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "hundred_update_own" on public.hundred_cells for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Invoker security keeps RLS active. Atomic upsert only accepts a newer field version.
create or replace function public.hundred_merge(incoming jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(incoming) <> 'array' or jsonb_array_length(incoming) > 10000 then
    raise exception 'Invalid payload';
  end if;
  insert into public.hundred_cells (user_id, key, value, at, device)
  select auth.uid(), x.key, x.value, x.at, x.device
  from jsonb_to_recordset(incoming) as x(key text, value jsonb, at bigint, device text)
  where x.at <= (extract(epoch from now()) * 1000)::bigint + 86400000
  on conflict (user_id, key) do update set value=excluded.value, at=excluded.at, device=excluded.device
  where (excluded.at, excluded.device) > (hundred_cells.at, hundred_cells.device);
end; $$;
revoke all on function public.hundred_merge(jsonb) from public, anon;
grant execute on function public.hundred_merge(jsonb) to authenticated;
