create extension if not exists pg_cron;

create table public.online_three_minute_peaks (
  bucket_end timestamptz primary key,
  peak_online integer check (peak_online >= 0)
);

alter table public.online_three_minute_peaks enable row level security;
revoke all on public.online_three_minute_peaks from public, anon, authenticated;
grant select on public.online_three_minute_peaks to anon, authenticated;
create policy "Read sealed online peaks" on public.online_three_minute_peaks
  for select to anon, authenticated using (true);

create function public.seal_online_three_minute_peaks(
  observed_at timestamptz default now()
)
returns void
language sql
set search_path = ''
as $$
  with cutoff as (
    select date_bin('3 minutes', observed_at - interval '10 seconds',
      timestamptz '2000-01-01 00:00:00+07') as last_end
  ),
  unsealed as (
    select buckets.bucket_end
    from cutoff
    cross join lateral generate_series(
      last_end - interval '117 minutes', last_end, interval '3 minutes'
    ) as buckets(bucket_end)
    where not exists (
      select 1 from public.online_three_minute_peaks as existing
      where existing.bucket_end = buckets.bucket_end
    )
  )
  insert into public.online_three_minute_peaks (bucket_end, peak_online)
  select bucket.bucket_end, max(sample.request_count)
  from unsealed as bucket
  cross join lateral generate_series(
    bucket.bucket_end - interval '3 minutes',
    bucket.bucket_end - interval '1 minute',
    interval '1 minute'
  ) as minute(sample_at)
  left join public.system_traffic_logs as sample
    on sample.date_str = to_char(minute.sample_at at time zone 'Asia/Ho_Chi_Minh', 'DD/MM/YYYY')
    and left(sample.time_slot::text, 5) = to_char(minute.sample_at at time zone 'Asia/Ho_Chi_Minh', 'HH24:MI')
    and sample.request_count >= 0
  group by bucket.bucket_end
  on conflict (bucket_end) do nothing;
$$;

revoke execute on function public.seal_online_three_minute_peaks(timestamptz)
  from public, anon, authenticated;

select cron.schedule(
  'seal-online-three-minute-peaks',
  '* * * * *',
  'select public.seal_online_three_minute_peaks()'
);
