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
