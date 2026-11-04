-- Independent media-studio tables. Does not modify IDEA tables or global auth policy.
create table public.miim_admins (
  email text primary key check (email = lower(email))
);
alter table public.miim_admins enable row level security;
revoke all on public.miim_admins from anon, authenticated;
insert into public.miim_admins(email) values ('resane.miim@gmail.com');

create function public.miim_is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u join public.miim_admins a on a.email = lower(u.email)
    where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$$;
revoke all on function public.miim_is_admin() from public;
grant execute on function public.miim_is_admin() to authenticated;

create table public.miim_content (
  id text primary key default 'main' check (id = 'main'),
  data jsonb not null default '{}'::jsonb
    check (jsonb_typeof(data) = 'object' and not (data ? 'authHash')),
  revision bigint not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.miim_content enable row level security;
revoke all on public.miim_content from anon, authenticated;
grant select on public.miim_content to anon, authenticated;
grant update (data) on public.miim_content to authenticated;
create policy miim_public_read on public.miim_content for select to anon, authenticated using (true);
create policy miim_admin_update on public.miim_content for update to authenticated
  using (public.miim_is_admin()) with check (public.miim_is_admin());

create function public.miim_stamp_content() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  new.revision := old.revision + 1;
  new.data := jsonb_set(new.data, '{updatedAt}', to_jsonb(new.updated_at));
  return new;
end;
$$;
create trigger miim_content_stamp before update on public.miim_content
  for each row execute function public.miim_stamp_content();
insert into public.miim_content(id, data) values ('main', '{}');
