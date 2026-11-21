revoke select on table public.class_schedule_requests
  from anon, authenticated, public;
revoke select (
  mon_hoc,
  nguoi_tao,
  team,
  sid_cid,
  "timestamp",
  created_at
) on table public.class_schedule_requests
  from anon, authenticated, public;

grant select (id, ma_lop, is_done, is_cancelled)
  on table public.class_schedule_requests
  to anon;
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
) on table public.class_schedule_requests to service_role;
grant update (is_done, is_cancelled)
  on table public.class_schedule_requests
  to service_role;

revoke update on table public.class_schedule_requests
  from anon, authenticated, public;
revoke update (is_done, is_cancelled)
  on table public.class_schedule_requests
  from anon, authenticated, public;

drop policy if exists "Allow anonymous class schedule status updates"
  on public.class_schedule_requests;
