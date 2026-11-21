alter table public.class_schedule_requests
  add column if not exists is_done boolean not null default false,
  add column if not exists is_cancelled boolean not null default false;

grant select (
  id,
  ma_lop,
  mon_hoc,
  nguoi_tao,
  team,
  sid_cid,
  "timestamp",
  created_at,
  is_done,
  is_cancelled
) on table public.class_schedule_requests to anon;

grant update (is_done, is_cancelled)
  on table public.class_schedule_requests
  to anon;

drop policy if exists "Allow anonymous class schedule count reads"
  on public.class_schedule_requests;
create policy "Allow anonymous class schedule count reads"
  on public.class_schedule_requests
  for select
  to anon
  using (true);

drop policy if exists "Allow anonymous class schedule status updates"
  on public.class_schedule_requests;
create policy "Allow anonymous class schedule status updates"
  on public.class_schedule_requests
  for update
  to anon
  using (true)
  with check (true);
