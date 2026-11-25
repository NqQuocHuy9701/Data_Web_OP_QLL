alter table public.class_schedule_requests
  add column if not exists cancel_reason text;

grant select (cancel_reason), update (cancel_reason)
  on table public.class_schedule_requests
  to service_role;
