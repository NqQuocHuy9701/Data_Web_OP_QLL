create table public.qll_notices (
  id integer generated always as identity primary key,
  delivery_id uuid not null unique,
  namecode text not null check (char_length(namecode) between 1 and 80),
  sender text not null check (char_length(sender) between 1 and 80),
  body text not null check (octet_length(body) between 1 and 1024 and btrim(body) <> ''),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index qll_notices_inbox_idx on public.qll_notices (namecode, id desc);
create index qll_notices_expiry_idx on public.qll_notices (created_at);
create index qll_notices_unread_idx on public.qll_notices (namecode, id) where read_at is null;

alter table public.qll_notices enable row level security;
revoke all on public.qll_notices from public, anon, authenticated;
grant select, insert, update, delete on public.qll_notices to service_role;
grant usage, select on sequence public.qll_notices_id_seq to service_role;

create function public.send_qll_notice(recipient text, admin_name text, notice_body text, delivery uuid)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  -- Serialize sends so the storage cap also holds for concurrent Admin requests.
  perform pg_catalog.pg_advisory_xact_lock(20261126, 1);
  if exists (select 1 from public.qll_notices where delivery_id = delivery) then
    return true;
  end if;
  if exists (select 1 from public.qll_notices limit 1 offset 9999) then
    return false;
  end if;

  insert into public.qll_notices (namecode, sender, body, delivery_id)
    values (recipient, admin_name, notice_body, delivery);
  return true;
end;
$$;

revoke all on function public.send_qll_notice(text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.send_qll_notice(text, text, text, uuid) to service_role;

create extension if not exists pg_cron;

-- Monday 20:00 UTC = Tuesday 03:00 Vietnam time.
select cron.schedule('purge-qll-notices', '0 20 * * 1', $job$
  select pg_catalog.pg_advisory_xact_lock(20261126, 1);
  delete from public.qll_notices where created_at < now() - interval '90 days';
$job$);
