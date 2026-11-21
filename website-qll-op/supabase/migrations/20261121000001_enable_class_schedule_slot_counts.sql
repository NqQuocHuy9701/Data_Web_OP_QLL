grant select (ma_lop, id) on table public.class_schedule_requests to anon;

create policy "Allow anonymous class schedule count reads"
  on public.class_schedule_requests
  for select
  to anon
  using (true);
