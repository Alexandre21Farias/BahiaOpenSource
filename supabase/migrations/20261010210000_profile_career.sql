-- Perfil profissional: campos publicos + curriculo em bucket privado.
-- Ja aplicado em producao via execute_sql; nao reexecutar.
alter table public.profiles
  add column if not exists headline text,
  add column if not exists experience_level text,
  add column if not exists skills text[] not null default '{}',
  add column if not exists work_modes text[] not null default '{}',
  add column if not exists open_to_work boolean not null default false,
  add column if not exists github_url text,
  add column if not exists linkedin_url text,
  add column if not exists resume_path text,
  add column if not exists resume_public boolean not null default false;

alter table public.profiles
  add constraint profiles_headline_check check (headline is null or char_length(headline) <= 100),
  add constraint profiles_level_check check (experience_level is null or experience_level in ('estagio','junior','pleno','senior')),
  add constraint profiles_skills_check check (cardinality(skills) <= 20),
  add constraint profiles_work_modes_check check (work_modes <@ array['remote','hybrid','onsite']::text[]),
  add constraint profiles_github_check check (github_url is null or github_url ~* '^https://(www\.)?github\.com/[A-Za-z0-9-]{1,39}/?$'),
  add constraint profiles_linkedin_check check (linkedin_url is null or linkedin_url ~* '^https://([a-z]{2,3}\.)?linkedin\.com/(in|company)/[^[:space:]]{1,100}$'),
  add constraint profiles_resume_path_check check (resume_path is null or resume_path like id::text || '/%');

-- Bucket privado: so PDF, ate 5 MB
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resumes', 'resumes', false, 5242880, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Owners upload own resume" on storage.objects for insert to authenticated
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Owners update own resume" on storage.objects for update to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Owners delete own resume" on storage.objects for delete to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);
-- Leitura: o proprio dono, ou membros logados quando o dono marcou resume_public
create policy "Read own or public resumes" on storage.objects for select to authenticated
  using (bucket_id = 'resumes' and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (select 1 from public.profiles p where p.id::text = (storage.foldername(name))[1] and p.resume_public)
  ));
