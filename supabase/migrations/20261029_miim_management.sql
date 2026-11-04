-- App-specific public media. The existing IDEA data and buckets are unchanged.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('miim-media', 'miim-media', true, 5242880,
  array['image/jpeg','image/png','image/webp','image/gif']);
create policy miim_media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'miim-media' and public.miim_is_admin());
-- Public buckets serve images through Storage's public endpoint. No client UPDATE/DELETE.
create policy miim_media_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'miim-media' and public.miim_is_admin());

create table public.miim_revisions (
  revision bigint primary key,
  data jsonb not null,
  saved_at timestamptz not null,
  archived_at timestamptz not null default now()
);
alter table public.miim_revisions enable row level security;
revoke all on public.miim_revisions from anon, authenticated;
grant select on public.miim_revisions to authenticated;
create policy miim_history_read on public.miim_revisions for select to authenticated
  using (public.miim_is_admin());
create function public.miim_archive_content() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.miim_revisions (revision, data, saved_at)
    values (old.revision, old.data, old.updated_at) on conflict (revision) do nothing;
  delete from public.miim_revisions where revision in
    (select revision from public.miim_revisions order by revision desc offset 30);
  return new;
end;
$$;
revoke all on function public.miim_archive_content() from public;
create trigger miim_archive_content after update on public.miim_content
  for each row execute function public.miim_archive_content();
