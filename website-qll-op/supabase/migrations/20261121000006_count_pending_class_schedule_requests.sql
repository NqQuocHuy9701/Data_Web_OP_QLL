create function public.count_pending_class_schedule_requests()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(jsonb_object_agg(ma_lop, request_count), '{}'::jsonb)
  from (
    select ma_lop, count(*) as request_count
    from public.class_schedule_requests
    where is_done = false and is_cancelled = false
    group by ma_lop
  ) as pending_counts;
$$;

revoke execute on function public.count_pending_class_schedule_requests()
  from public;
grant execute on function public.count_pending_class_schedule_requests()
  to anon;
