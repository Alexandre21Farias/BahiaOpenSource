-- Vagas salvas (bookmark) do app mobile. NAO aplicado ainda: rodar no Supabase.
create table public.job_bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

alter table public.job_bookmarks enable row level security;

create policy job_bookmarks_select on public.job_bookmarks for select to authenticated
  using (user_id = (select auth.uid()));
create policy job_bookmarks_insert on public.job_bookmarks for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy job_bookmarks_delete on public.job_bookmarks for delete to authenticated
  using (user_id = (select auth.uid()));

create index job_bookmarks_job_idx on public.job_bookmarks (job_id);
