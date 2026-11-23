create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists supabase_vault with schema vault;

create table public.class_schedule_overdue_alerts (
  request_id bigint primary key references public.class_schedule_requests(id) on delete cascade,
  claimed_at timestamptz not null,
  sent_at timestamptz
);

alter table public.class_schedule_overdue_alerts enable row level security;
revoke all on public.class_schedule_overdue_alerts from public, anon, authenticated;
grant select (request_id, claimed_at), update (sent_at)
  on public.class_schedule_overdue_alerts to service_role;

create index class_schedule_pending_overdue_idx
  on public.class_schedule_requests ("timestamp", id)
  where not is_done and not is_cancelled;

create function public.claim_overdue_class_schedule_requests()
returns table (id bigint, sid_cid text, claimed_at timestamptz)
language sql
security definer
set search_path = ''
as $$
  with overdue as (
    select request.id, request.sid_cid
    from public.class_schedule_requests as request
    left join public.class_schedule_overdue_alerts as alert on alert.request_id = request.id
    where not request.is_done and not request.is_cancelled
      and alert.sent_at is null
      and request."timestamp" <= floor(extract(epoch from now()) * 1000)::bigint - 7200000
      and (
        alert.claimed_at is null
        or alert.claimed_at <= now() - interval '5 minutes'
      )
    order by request."timestamp", request.id
    limit 200
    for update of request skip locked
  ), claimed as (
    insert into public.class_schedule_overdue_alerts as alert (request_id, claimed_at)
    select overdue.id, now() from overdue
    on conflict (request_id) do update set claimed_at = excluded.claimed_at
      where alert.sent_at is null and alert.claimed_at <= now() - interval '5 minutes'
    returning alert.request_id, alert.claimed_at
  )
  select overdue.id, overdue.sid_cid, claimed.claimed_at
  from claimed join overdue on overdue.id = claimed.request_id;
$$;

revoke execute on function public.claim_overdue_class_schedule_requests()
  from public, anon, authenticated;
grant execute on function public.claim_overdue_class_schedule_requests()
  to service_role;

-- Configure these Vault entries with the deployed function URL and the
-- same CLASS_SCHEDULE_WEBHOOK_SECRET used by the Edge Function.
select cron.schedule(
  'class-schedule-overdue-telegram',
  '* * * * *',
  $cron$
    select net.http_post(
      url := endpoint.decrypted_secret,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-supabase-webhook-secret', secret.decrypted_secret
      ),
      body := '{"type":"OVERDUE_CHECK"}'::jsonb,
      timeout_milliseconds := 30000
    )
    from vault.decrypted_secrets as endpoint
    cross join vault.decrypted_secrets as secret
    where endpoint.name = 'class_schedule_telegram_url'
      and secret.name = 'class_schedule_webhook_secret'
    limit 1;
  $cron$
);
