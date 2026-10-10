-- Categoria consistente com o front
alter table public.publications alter column category set default 'discussao';
update public.publications set category = 'discussao' where category is null;
alter table public.publications alter column category set not null;
alter table public.publications add constraint publications_category_check
  check (category in ('discussao','projetos','duvidas','artigo','eventos'));

-- updated_at automatico
create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

create trigger set_updated_at before update on public.publications for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.projects for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.tasks for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.milestones for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.task_comments for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.task_checklist_items for each row execute function private.set_updated_at();

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

-- Task so pode referenciar status/milestone/pai do proprio projeto
create or replace function private.validate_task_refs()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.project_statuses where id = new.status_id and project_id = new.project_id) then
    raise exception 'status_id nao pertence ao projeto da task';
  end if;
  if new.milestone_id is not null and not exists
     (select 1 from public.milestones where id = new.milestone_id and project_id = new.project_id) then
    raise exception 'milestone_id nao pertence ao projeto da task';
  end if;
  if new.parent_task_id is not null and not exists
     (select 1 from public.tasks where id = new.parent_task_id and project_id = new.project_id) then
    raise exception 'parent_task_id nao pertence ao projeto da task';
  end if;
  return new;
end $$;

create trigger validate_task_refs before insert or update on public.tasks
  for each row execute function private.validate_task_refs();
