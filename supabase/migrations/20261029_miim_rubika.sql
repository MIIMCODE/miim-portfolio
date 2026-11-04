-- Isolated MIIM bot settings/inbox. No changes to IDEA or existing content/auth tables.
create table public.miim_bot_settings (
  id text primary key check (id = 'main'),
  chat_id text,
  paired_at timestamptz,
  pairing_hash text,
  pairing_user uuid,
  pairing_expires timestamptz,
  polling_offset text
);
insert into public.miim_bot_settings(id) values ('main');
create table public.miim_order_inbox (
  id uuid primary key,
  payload jsonb not null,
  fingerprint text not null,
  source_hash text not null,
  phone text not null,
  state text not null default 'queued' check (state in ('queued','sending','sent','failed','uncertain')),
  message_id text,
  created_at timestamptz not null default now(),
  attempted_at timestamptz
);
create index miim_order_recent on public.miim_order_inbox(created_at desc);
create index miim_order_source on public.miim_order_inbox(source_hash,created_at);
create index miim_order_phone on public.miim_order_inbox(phone,created_at);
create table public.miim_bot_events (
  id text primary key,
  state text not null check (state in ('sending','sent','failed','uncertain')),
  created_at timestamptz not null default now()
);
alter table public.miim_bot_settings enable row level security;
alter table public.miim_order_inbox enable row level security;
alter table public.miim_bot_events enable row level security;
revoke all on public.miim_bot_settings, public.miim_order_inbox, public.miim_bot_events from public, anon, authenticated;
grant all on public.miim_bot_settings, public.miim_order_inbox, public.miim_bot_events to service_role;

-- Serialize intake limits and duplicate detection across edge instances, not just one process.
create function public.miim_accept_order(p_id uuid,p_payload jsonb,p_fingerprint text,p_source text,p_phone text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare existing public.miim_order_inbox; result public.miim_order_inbox;
begin
  perform pg_advisory_xact_lock(461900271);
  select * into existing from public.miim_order_inbox where id=p_id;
  if found then
    if existing.fingerprint <> p_fingerprint then raise exception 'idempotency_conflict'; end if;
    return to_jsonb(existing);
  end if;
  if (select count(*) from public.miim_order_inbox where created_at > now()-interval '10 minutes' and source_hash=p_source) >= 3
     or (select count(*) from public.miim_order_inbox where created_at > now()-interval '10 minutes' and phone=p_phone) >= 2
     or (select count(*) from public.miim_order_inbox where created_at > now()-interval '1 hour') >= 30 then
    raise exception 'rate_limited';
  end if;
  delete from public.miim_order_inbox where created_at < now()-interval '90 days';
  delete from public.miim_bot_events where created_at < now()-interval '90 days';
  insert into public.miim_order_inbox(id,payload,fingerprint,source_hash,phone)
    values(p_id,p_payload,p_fingerprint,p_source,p_phone) returning * into result;
  return to_jsonb(result);
end;
$$;
revoke all on function public.miim_accept_order(uuid,jsonb,text,text,text) from public, anon, authenticated;
grant execute on function public.miim_accept_order(uuid,jsonb,text,text,text) to service_role;

-- Explicit admin retry of uncertain delivery can duplicate a message; never retry automatically.
create function public.miim_claim_order(p_id uuid,p_retry boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result public.miim_order_inbox;
begin
  update public.miim_order_inbox set state='sending',attempted_at=now()
    where id=p_id and (state='queued' or (p_retry and state in ('failed','uncertain'))
      or (p_retry and state='sending' and attempted_at < now()-interval '2 minutes'))
    returning * into result;
  if not found then return null; end if;
  return to_jsonb(result);
end;
$$;
revoke all on function public.miim_claim_order(uuid,boolean) from public, anon, authenticated;
grant execute on function public.miim_claim_order(uuid,boolean) to service_role;
