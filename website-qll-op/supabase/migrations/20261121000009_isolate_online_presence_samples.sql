create table public.online_presence_samples (
  sample_minute timestamptz primary key,
  online_count integer not null check (online_count >= 0)
);

alter table public.online_presence_samples enable row level security;
revoke all on public.online_presence_samples from public, anon, authenticated;
grant insert on public.online_presence_samples to anon, authenticated;
create policy "Insert only recent online samples" on public.online_presence_samples
  for insert to anon, authenticated
  with check (
    sample_minute = date_bin('1 minute', sample_minute, timestamptz '2000-01-01 00:00:00+00')
    and sample_minute <= date_bin('1 minute', now(), timestamptz '2000-01-01 00:00:00+00')
    and sample_minute >= now() - interval '2 minutes'
  );

create or replace function public.seal_online_three_minute_peaks(
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
  select bucket.bucket_end, max(sample.online_count)
  from unsealed as bucket
  left join public.online_presence_samples as sample
    on sample.sample_minute >= bucket.bucket_end - interval '3 minutes'
    and sample.sample_minute < bucket.bucket_end
  group by bucket.bucket_end
  on conflict (bucket_end) do nothing;
$$;
