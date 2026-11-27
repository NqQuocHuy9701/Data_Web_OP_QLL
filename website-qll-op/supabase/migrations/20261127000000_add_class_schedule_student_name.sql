alter table public.class_schedule_requests
  add column if not exists student_name text
  check (student_name is null or char_length(btrim(student_name)) between 1 and 120);

grant select (student_name) on public.class_schedule_requests to service_role;
