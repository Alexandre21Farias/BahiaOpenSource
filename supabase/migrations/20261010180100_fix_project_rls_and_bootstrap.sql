-- Schema nao exposto pela API para funcoes auxiliares
create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.is_project_member(_project_id uuid, _roles public.project_role[] default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.projects p
                 where p.id = _project_id and p.owner_id = (select auth.uid()))
      or exists (select 1 from public.project_participants pp
                 where pp.project_id = _project_id
                   and pp.user_id = (select auth.uid())
                   and (_roles is null or pp.role = any (_roles)));
$$;

create or replace function private.task_project_id(_task_id uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select project_id from public.tasks where id = _task_id;
$$;
revoke all on function private.is_project_member(uuid, public.project_role[]) from public;
revoke all on function private.task_project_id(uuid) from public;
grant execute on function private.is_project_member(uuid, public.project_role[]) to authenticated;
grant execute on function private.task_project_id(uuid) to authenticated;

-- Remove todas as policies antigas das tabelas do modulo de projetos
do $$
declare r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies
           where schemaname = 'public'
             and tablename in ('projects','project_participants','project_statuses','milestones','tags',
                               'tasks','task_tags','task_checklist_items','task_comments','activity_logs')
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- projects
create policy projects_select on public.projects for select to authenticated
  using (private.is_project_member(id));
create policy projects_insert on public.projects for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy projects_update on public.projects for update to authenticated
  using (private.is_project_member(id, array['owner','admin']::public.project_role[]));
create policy projects_delete on public.projects for delete to authenticated
  using (owner_id = (select auth.uid()));

-- project_participants
create policy participants_select on public.project_participants for select to authenticated
  using (private.is_project_member(project_id));
create policy participants_insert on public.project_participants for insert to authenticated
  with check (private.is_project_member(project_id, array['owner','admin']::public.project_role[]) and role <> 'owner');
create policy participants_update on public.project_participants for update to authenticated
  using (private.is_project_member(project_id, array['owner','admin']::public.project_role[]))
  with check (role <> 'owner');
create policy participants_delete on public.project_participants for delete to authenticated
  using (private.is_project_member(project_id, array['owner','admin']::public.project_role[]) and role <> 'owner');

-- project_statuses (escrita: owner/admin)
create policy statuses_select on public.project_statuses for select to authenticated
  using (private.is_project_member(project_id));
create policy statuses_insert on public.project_statuses for insert to authenticated
  with check (private.is_project_member(project_id, array['owner','admin']::public.project_role[]));
create policy statuses_update on public.project_statuses for update to authenticated
  using (private.is_project_member(project_id, array['owner','admin']::public.project_role[]));
create policy statuses_delete on public.project_statuses for delete to authenticated
  using (private.is_project_member(project_id, array['owner','admin']::public.project_role[]));

-- milestones, tags, tasks (escrita: owner/admin/member)
create policy milestones_select on public.milestones for select to authenticated using (private.is_project_member(project_id));
create policy milestones_insert on public.milestones for insert to authenticated with check (private.is_project_member(project_id, array['owner','admin','member']::public.project_role[]));
create policy milestones_update on public.milestones for update to authenticated using (private.is_project_member(project_id, array['owner','admin','member']::public.project_role[]));
create policy milestones_delete on public.milestones for delete to authenticated using (private.is_project_member(project_id, array['owner','admin','member']::public.project_role[]));

create policy tags_select on public.tags for select to authenticated using (private.is_project_member(project_id));
create policy tags_insert on public.tags for insert to authenticated with check (private.is_project_member(project_id, array['owner','admin','member']::public.project_role[]));
create policy tags_update on public.tags for update to authenticated using (private.is_project_member(project_id, array['owner','admin','member']::public.project_role[]));
create policy tags_delete on public.tags for delete to authenticated using (private.is_project_member(project_id, array['owner','admin','member']::public.project_role[]));

create policy tasks_select on public.tasks for select to authenticated using (private.is_project_member(project_id));
create policy tasks_insert on public.tasks for insert to authenticated with check (private.is_project_member(project_id, array['owner','admin','member']::public.project_role[]));
create policy tasks_update on public.tasks for update to authenticated using (private.is_project_member(project_id, array['owner','admin','member']::public.project_role[]));
create policy tasks_delete on public.tasks for delete to authenticated using (private.is_project_member(project_id, array['owner','admin','member']::public.project_role[]));

-- tabelas filhas de tasks
create policy task_tags_select on public.task_tags for select to authenticated using (private.is_project_member(private.task_project_id(task_id)));
create policy task_tags_insert on public.task_tags for insert to authenticated with check (private.is_project_member(private.task_project_id(task_id), array['owner','admin','member']::public.project_role[]));
create policy task_tags_delete on public.task_tags for delete to authenticated using (private.is_project_member(private.task_project_id(task_id), array['owner','admin','member']::public.project_role[]));

create policy checklist_select on public.task_checklist_items for select to authenticated using (private.is_project_member(private.task_project_id(task_id)));
create policy checklist_insert on public.task_checklist_items for insert to authenticated with check (private.is_project_member(private.task_project_id(task_id), array['owner','admin','member']::public.project_role[]));
create policy checklist_update on public.task_checklist_items for update to authenticated using (private.is_project_member(private.task_project_id(task_id), array['owner','admin','member']::public.project_role[]));
create policy checklist_delete on public.task_checklist_items for delete to authenticated using (private.is_project_member(private.task_project_id(task_id), array['owner','admin','member']::public.project_role[]));

create policy task_comments_select on public.task_comments for select to authenticated using (private.is_project_member(private.task_project_id(task_id)));
create policy task_comments_insert on public.task_comments for insert to authenticated
  with check (user_id = (select auth.uid()) and private.is_project_member(private.task_project_id(task_id), array['owner','admin','member']::public.project_role[]));
create policy task_comments_update on public.task_comments for update to authenticated using (user_id = (select auth.uid()));
create policy task_comments_delete on public.task_comments for delete to authenticated using (user_id = (select auth.uid()));

-- activity_logs
create policy logs_select on public.activity_logs for select to authenticated using (private.is_project_member(project_id));
create policy logs_insert on public.activity_logs for insert to authenticated
  with check (user_id = (select auth.uid()) and private.is_project_member(project_id));

-- Ao criar um projeto: dono vira participante e entram os status padrao
create or replace function private.bootstrap_project()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.project_participants (project_id, user_id, role)
  values (new.id, new.owner_id, 'owner');

  insert into public.project_statuses (project_id, name, color, category, position) values
    (new.id, 'Backlog',       '#94a3b8', 'backlog',   0),
    (new.id, 'A fazer',       '#60a5fa', 'unstarted', 1),
    (new.id, 'Em andamento',  '#f59e0b', 'started',   2),
    (new.id, 'Concluído',     '#22c55e', 'completed', 3),
    (new.id, 'Cancelado',     '#ef4444', 'canceled',  4);
  return new;
end $$;

create trigger on_project_created after insert on public.projects
  for each row execute function private.bootstrap_project();
