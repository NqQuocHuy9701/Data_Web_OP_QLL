alter table public.class_schedule_requests
  add column if not exists processed_by text,
  add column if not exists processed_at timestamptz;

grant select (processed_by, processed_at)
  on table public.class_schedule_requests
  to service_role;

grant update (processed_by, processed_at)
  on table public.class_schedule_requests
  to service_role;
