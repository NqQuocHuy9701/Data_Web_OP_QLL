create function public.class_schedule_daily_stats(start_day date, end_day date)
returns table (day date, requests integer, added integer, cancelled integer)
language sql
stable
security invoker
set search_path = ''
as $$
  with bounds as (
    select start_day as first_day, end_day as last_day
    where start_day >= date '2026-11-01' and end_day - start_day between 0 and 30
  ),
  daily as (
    select (created_at at time zone 'Asia/Ho_Chi_Minh')::date as day,
           count(*)::integer as requests,
           count(*) filter (where is_done and not is_cancelled)::integer as added,
           count(*) filter (where is_cancelled)::integer as cancelled
    from public.class_schedule_requests cross join bounds
    where created_at >= (first_day::timestamp at time zone 'Asia/Ho_Chi_Minh')
      and created_at < ((last_day + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh')
    group by 1
  )
  select first_day + n, coalesce(daily.requests, 0),
         coalesce(daily.added, 0), coalesce(daily.cancelled, 0)
  from bounds cross join lateral generate_series(0, last_day - first_day) as series(n)
  left join daily on daily.day = first_day + n
  order by 1;
$$;

revoke execute on function public.class_schedule_daily_stats(date, date) from public, anon, authenticated;
grant execute on function public.class_schedule_daily_stats(date, date) to service_role;

create function public.class_schedule_monthly_stats(report_year integer)
returns table (day date, requests integer, added integer, cancelled integer)
language sql
stable
security invoker
set search_path = ''
as $$
  with period as (
    select greatest(make_date(report_year, 1, 1), date '2026-10-01') as start_date,
           least(make_date(report_year, 12, 1),
                 date_trunc('month', now() at time zone 'Asia/Ho_Chi_Minh')::date) as end_month
    where report_year between 2026 and extract(year from now() at time zone 'Asia/Ho_Chi_Minh')
  ),
  monthly as (
    select date_trunc('month', created_at at time zone 'Asia/Ho_Chi_Minh')::date as month,
           count(*)::integer as requests,
           count(*) filter (where is_done and not is_cancelled)::integer as added,
           count(*) filter (where is_cancelled)::integer as cancelled
    from public.class_schedule_requests cross join period
    where created_at >= (start_date::timestamp at time zone 'Asia/Ho_Chi_Minh')
      and created_at < ((end_month + interval '1 month') at time zone 'Asia/Ho_Chi_Minh')
    group by 1
  )
  select series.month::date, coalesce(monthly.requests, 0),
         coalesce(monthly.added, 0), coalesce(monthly.cancelled, 0)
  from period
  cross join lateral generate_series(start_date::timestamp, end_month::timestamp, interval '1 month') as series(month)
  left join monthly on monthly.month = series.month::date
  order by 1;
$$;

revoke execute on function public.class_schedule_monthly_stats(integer) from public, anon, authenticated;
grant execute on function public.class_schedule_monthly_stats(integer) to service_role;
