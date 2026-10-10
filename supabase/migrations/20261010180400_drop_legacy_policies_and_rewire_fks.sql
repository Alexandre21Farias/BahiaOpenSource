-- Passo destrutivo (DROP), separado das migrations aditivas ja aplicadas.
-- Remove as policies antigas (substituidas por *_select/_insert/... com private.is_project_member)
-- e refaz as FKs com cascade. Rode no SQL Editor do Supabase (aceita DROP sem confirmacao pendente).

-- 1) Policies antigas do modulo de projetos
drop policy "Insercao de logs para participantes" on public.activity_logs;
drop policy "Leitura de logs para participantes" on public.activity_logs;
drop policy "Escrita de milestones para membros ativos" on public.milestones;
drop policy "Leitura de milestones para participantes" on public.milestones;
drop policy "Donos e Admins gerenciam participantes" on public.project_participants;
drop policy "Membros veem participantes dos mesmos projetos" on public.project_participants;
drop policy "Escrita de status para admins e donos" on public.project_statuses;
drop policy "Leitura de status para participantes" on public.project_statuses;
drop policy "Atualização de projetos permitida para donos e admins" on public.projects;
drop policy "Criação de projetos liberada para usuários autenticados" on public.projects;
drop policy "Exclusão de projetos permitida apenas para donos" on public.projects;
drop policy "Leitura de projetos permitida para donos e participantes" on public.projects;
drop policy "Escrita de tags para membros ativos" on public.tags;
drop policy "Leitura de tags para participantes" on public.tags;
drop policy "Escrita de checklist para membros ativos" on public.task_checklist_items;
drop policy "Leitura de checklist para participantes" on public.task_checklist_items;
drop policy "Edicao de comentarios pelo proprio autor" on public.task_comments;
drop policy "Exclusao de comentarios pelo autor" on public.task_comments;
drop policy "Insercao de comentarios para participantes" on public.task_comments;
drop policy "Leitura de comentarios para participantes" on public.task_comments;
drop policy "Escrita de task_tags para membros ativos" on public.task_tags;
drop policy "Leitura de task_tags para participantes" on public.task_tags;
drop policy "Escrita de tasks para membros ativos" on public.tasks;
drop policy "Leitura de tasks para participantes" on public.tasks;

create policy task_comments_update on public.task_comments for update to authenticated using (user_id = (select auth.uid()));
create policy task_comments_delete on public.task_comments for delete to authenticated using (user_id = (select auth.uid()));

-- 2) Policies de perfis/publicacoes/comentarios: authenticated + (select auth.uid())
drop policy "Users can insert their own profile." on public.profiles;
drop policy "Users can update own profile." on public.profiles;
drop policy "Authenticated users can create comments" on public.publication_comments;
drop policy "Users can delete their own comments" on public.publication_comments;
drop policy "Authenticated users can create publications" on public.publications;
drop policy "Users can delete their own publications" on public.publications;
drop policy "Users can update their own publications" on public.publications;

create policy profiles_insert on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update on public.profiles for update to authenticated using ((select auth.uid()) = id);
create policy pub_comments_insert on public.publication_comments for insert to authenticated with check ((select auth.uid()) = user_id);
create policy pub_comments_delete on public.publication_comments for delete to authenticated using ((select auth.uid()) = user_id);
create policy publications_insert on public.publications for insert to authenticated with check ((select auth.uid()) = user_id);
create policy publications_update on public.publications for update to authenticated using ((select auth.uid()) = user_id);
create policy publications_delete on public.publications for delete to authenticated using ((select auth.uid()) = user_id);

-- 3) Storage: impede listar o bucket e restringe upload ao proprio usuario
--    (aceita pasta "<uid>/" e o prefixo legado "<uid>_")
drop policy "Public Access" on storage.objects;
drop policy "Authenticated users can upload images" on storage.objects;
drop policy "Users can delete own images" on storage.objects;
create policy "Users upload own publication images" on storage.objects for insert to authenticated
  with check (bucket_id = 'publications' and ((storage.foldername(name))[1] = (select auth.uid())::text or name like (select auth.uid())::text || '\_%'));
create policy "Users delete own publication images" on storage.objects for delete to authenticated
  using (bucket_id = 'publications' and owner = (select auth.uid()));

-- 4) FKs com cascade (ver 20261010180300_integrity.sql, secao "Cascatas")
-- Cascatas
alter table public.publications drop constraint publications_user_id_fkey,
  add constraint publications_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.publication_comments drop constraint publication_comments_user_id_fkey,
  add constraint publication_comments_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.publication_comments drop constraint publication_comments_publication_id_fkey,
  add constraint publication_comments_publication_id_fkey foreign key (publication_id) references public.publications(id) on delete cascade;
alter table public.profiles drop constraint profiles_id_fkey,
  add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;

alter table public.project_participants drop constraint project_participants_project_id_fkey,
  add constraint project_participants_project_id_fkey foreign key (project_id) references public.projects(id) on delete cascade;
alter table public.project_participants drop constraint project_participants_user_id_fkey,
  add constraint project_participants_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.project_statuses drop constraint project_statuses_project_id_fkey,
  add constraint project_statuses_project_id_fkey foreign key (project_id) references public.projects(id) on delete cascade;
alter table public.milestones drop constraint milestones_project_id_fkey,
  add constraint milestones_project_id_fkey foreign key (project_id) references public.projects(id) on delete cascade;
alter table public.tags drop constraint tags_project_id_fkey,
  add constraint tags_project_id_fkey foreign key (project_id) references public.projects(id) on delete cascade;
alter table public.activity_logs drop constraint activity_logs_project_id_fkey,
  add constraint activity_logs_project_id_fkey foreign key (project_id) references public.projects(id) on delete cascade;
alter table public.tasks drop constraint tasks_project_id_fkey,
  add constraint tasks_project_id_fkey foreign key (project_id) references public.projects(id) on delete cascade;
alter table public.tasks drop constraint tasks_parent_task_id_fkey,
  add constraint tasks_parent_task_id_fkey foreign key (parent_task_id) references public.tasks(id) on delete cascade;
alter table public.tasks drop constraint tasks_milestone_id_fkey,
  add constraint tasks_milestone_id_fkey foreign key (milestone_id) references public.milestones(id) on delete set null;
alter table public.tasks drop constraint tasks_assignee_id_fkey,
  add constraint tasks_assignee_id_fkey foreign key (assignee_id) references auth.users(id) on delete set null;
alter table public.task_tags drop constraint task_tags_task_id_fkey,
  add constraint task_tags_task_id_fkey foreign key (task_id) references public.tasks(id) on delete cascade;
alter table public.task_tags drop constraint task_tags_tag_id_fkey,
  add constraint task_tags_tag_id_fkey foreign key (tag_id) references public.tags(id) on delete cascade;
alter table public.task_checklist_items drop constraint task_checklist_items_task_id_fkey,
  add constraint task_checklist_items_task_id_fkey foreign key (task_id) references public.tasks(id) on delete cascade;
alter table public.task_comments drop constraint task_comments_task_id_fkey,
  add constraint task_comments_task_id_fkey foreign key (task_id) references public.tasks(id) on delete cascade;

