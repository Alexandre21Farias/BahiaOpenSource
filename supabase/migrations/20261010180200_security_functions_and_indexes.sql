-- Funcoes SECURITY DEFINER nao devem ser chamaveis via /rest/v1/rpc
alter function public.handle_new_user() set search_path = '';
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Policies de publicacoes/perfis/comentarios: authenticated + (select auth.uid())
do $$
declare r record;
begin
  for r in select tablename, policyname from pg_policies
           where schemaname='public' and tablename in ('profiles','publications','publication_comments')
             and policyname not like 'Public%'
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

create policy profiles_insert on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update on public.profiles for update to authenticated using ((select auth.uid()) = id);
create policy publications_insert on public.publications for insert to authenticated with check ((select auth.uid()) = user_id);
create policy publications_update on public.publications for update to authenticated using ((select auth.uid()) = user_id);
create policy publications_delete on public.publications for delete to authenticated using ((select auth.uid()) = user_id);
create policy pub_comments_insert on public.publication_comments for insert to authenticated with check ((select auth.uid()) = user_id);
create policy pub_comments_delete on public.publication_comments for delete to authenticated using ((select auth.uid()) = user_id);

-- Indices das 17 FKs sem cobertura
create index if not exists activity_logs_project_id_idx on public.activity_logs (project_id);
create index if not exists activity_logs_user_id_idx on public.activity_logs (user_id);
create index if not exists milestones_project_id_idx on public.milestones (project_id);
create index if not exists project_participants_user_id_idx on public.project_participants (user_id);
create index if not exists projects_owner_id_idx on public.projects (owner_id);
create index if not exists publication_comments_publication_created_idx on public.publication_comments (publication_id, created_at);
create index if not exists publication_comments_user_id_idx on public.publication_comments (user_id);
create index if not exists publications_user_created_idx on public.publications (user_id, created_at desc);
create index if not exists publications_created_idx on public.publications (created_at desc);
create index if not exists publications_category_created_idx on public.publications (category, created_at desc);
create index if not exists task_checklist_items_task_id_idx on public.task_checklist_items (task_id);
create index if not exists task_comments_task_id_idx on public.task_comments (task_id);
create index if not exists task_comments_user_id_idx on public.task_comments (user_id);
create index if not exists task_tags_tag_id_idx on public.task_tags (tag_id);
create index if not exists tasks_assignee_id_idx on public.tasks (assignee_id);
create index if not exists tasks_milestone_id_idx on public.tasks (milestone_id);
create index if not exists tasks_parent_task_id_idx on public.tasks (parent_task_id);
create index if not exists tasks_project_id_idx on public.tasks (project_id);
create index if not exists tasks_status_id_idx on public.tasks (status_id);
