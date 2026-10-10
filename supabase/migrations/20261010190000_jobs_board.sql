-- Quadro de vagas do forum (ja aplicado em producao via execute_sql; nao reexecutar).
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  company text not null check (char_length(company) between 1 and 80),
  description text not null check (char_length(description) between 10 and 5000),
  location text check (location is null or char_length(location) <= 80),
  work_mode text not null default 'remote' check (work_mode in ('remote','hybrid','onsite')),
  job_type text not null default 'clt' check (job_type in ('clt','pj','estagio','freelance','voluntario')),
  level text check (level is null or level in ('estagio','junior','pleno','senior')),
  salary text check (salary is null or char_length(salary) <= 60),
  tags text[] not null default '{}' check (cardinality(tags) <= 10),
  apply_url text check (apply_url is null or (apply_url ~* '^https?://' and char_length(apply_url) <= 500)),
  apply_email text check (apply_email is null or (apply_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(apply_email) <= 120)),
  is_open boolean not null default true,
  expires_at timestamptz not null default (now() + interval '60 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_apply_contact check (apply_url is not null or apply_email is not null)
);

alter table public.jobs enable row level security;

create policy jobs_select on public.jobs for select to anon, authenticated
  using ((is_open and expires_at > now()) or user_id = (select auth.uid()));
create policy jobs_insert on public.jobs for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy jobs_update on public.jobs for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy jobs_delete on public.jobs for delete to authenticated
  using (user_id = (select auth.uid()));

create index jobs_listing_idx on public.jobs (is_open, created_at desc);
create index jobs_user_idx on public.jobs (user_id, created_at desc);

create trigger set_updated_at before update on public.jobs
  for each row execute function private.set_updated_at();

-- Antispam: no maximo 5 vagas abertas por usuario
create or replace function private.limit_open_jobs() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.is_open and (
    select count(*) from public.jobs
    where user_id = new.user_id and is_open and expires_at > now() and id <> new.id
  ) >= 5 then
    raise exception 'limite de 5 vagas abertas por usuario';
  end if;
  return new;
end $$;
create trigger limit_open_jobs before insert or update of is_open on public.jobs
  for each row execute function private.limit_open_jobs();
