create or replace function public.reject_duplicate_slot_hold()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  student_key text := substring(lower(new.note) from '^sid/cid:[[:space:]]*([0-9]{1,8})[[:space:]]*$');
  class_key text := upper(btrim(new.ma_lop));
  now_ms bigint;
begin
  if student_key is null or new.is_cancelled is true then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('slot-hold:' || student_key || ':' || class_key, 0));
  now_ms := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;

  if exists (
    select 1
    from public.slot_holds
    where is_cancelled is not true
      and "timestamp" > now_ms - 86400000
      and substring(lower(note) from '^sid/cid:[[:space:]]*([0-9]{1,8})[[:space:]]*$') = student_key
      and upper(btrim(ma_lop)) = class_key
  ) then
    raise exception using errcode = 'PT409', message = 'hold_same_class';
  end if;

  new."timestamp" := now_ms;
  return new;
end;
$$;

create or replace trigger reject_duplicate_slot_hold
before insert on public.slot_holds
for each row execute function public.reject_duplicate_slot_hold();

revoke execute on function public.reject_duplicate_slot_hold() from public, anon, authenticated;
