create index if not exists class_schedule_requests_student_class_idx
  on public.class_schedule_requests (sid_cid, upper(btrim(ma_lop)));

create index if not exists slot_holds_student_recent_idx
  on public.slot_holds (
    (substring(lower(note) from '^sid/cid:[[:space:]]*([0-9]{1,8})[[:space:]]*$')),
    "timestamp"
  )
  where is_cancelled is not true;

create function public.reject_duplicate_class_schedule_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  class_key text := upper(btrim(new.ma_lop));
begin
  perform pg_advisory_xact_lock(hashtextextended('add-class:' || new.sid_cid || ':' || class_key, 0));
  if exists (
    select 1
    from public.class_schedule_requests
    where sid_cid = new.sid_cid and upper(btrim(ma_lop)) = class_key
  ) then
    raise exception using errcode = 'PT409', message = 'add_class_duplicate';
  end if;
  return new;
end;
$$;

create trigger reject_duplicate_class_schedule_request
before insert on public.class_schedule_requests
for each row execute function public.reject_duplicate_class_schedule_request();

create function public.reject_duplicate_slot_hold()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  student_key text := substring(lower(new.note) from '^sid/cid:[[:space:]]*([0-9]{1,8})[[:space:]]*$');
  now_ms bigint;
  same_class boolean;
begin
  if student_key is null or new.is_cancelled is true then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('slot-hold:' || student_key, 0));
  now_ms := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  select upper(btrim(ma_lop)) = upper(btrim(new.ma_lop))
    into same_class
  from public.slot_holds
  where is_cancelled is not true
    and "timestamp" > now_ms - 86400000
    and substring(lower(note) from '^sid/cid:[[:space:]]*([0-9]{1,8})[[:space:]]*$') = student_key
  order by (upper(btrim(ma_lop)) = upper(btrim(new.ma_lop))) desc nulls last
  limit 1;

  if found then
    if same_class then
      raise exception using errcode = 'PT409', message = 'hold_same_class';
    end if;
    raise exception using errcode = 'PT409', message = 'hold_other_class';
  end if;

  new."timestamp" := now_ms;
  return new;
end;
$$;

create trigger reject_duplicate_slot_hold
before insert on public.slot_holds
for each row execute function public.reject_duplicate_slot_hold();

revoke execute on function public.reject_duplicate_class_schedule_request() from public, anon, authenticated;
revoke execute on function public.reject_duplicate_slot_hold() from public, anon, authenticated;
