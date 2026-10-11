-- PROPOSTA (etapa 4) — NÃO APLICAR sem aprovação.
-- Depois de aprovada, este arquivo vai para supabase/migrations/.
--
-- Cobre: "boa primeira tarefa", etiquetas e link de PR nas tarefas;
-- "dúvida resolvida" no fórum; sugestão de tarefa para praticar o que
-- falta numa vaga; contadores, selos e linha do tempo do perfil.

-- ============================================================
-- 1. Tarefas: etiquetas, boa 1ª tarefa, PR e data de conclusão
-- ============================================================
alter table public.tasks
  add column labels text[] not null default '{}'
    check (cardinality(labels) <= 6),
  add column good_first_task boolean not null default false,
  add column pr_url text
    check (pr_url ~ '^https://github\.com/[^/\s]+/[^/\s]+/pull/[0-9]+$'),
  add column pr_state text
    check (pr_state in ('draft', 'open', 'merged', 'closed')),
  add column completed_at timestamptz;

-- PR sem link não tem estado.
alter table public.tasks
  add constraint tasks_pr_state_needs_url check (pr_state is null or pr_url is not null);

create index tasks_good_first_idx on public.tasks (project_id)
  where good_first_task and assignee_id is null;
create index tasks_labels_idx on public.tasks using gin (labels);
create index tasks_assignee_completed_idx on public.tasks (assignee_id, completed_at)
  where completed_at is not null;

-- completed_at acompanha a categoria do status (entrou/saiu de "completed").
create or replace function private.tasks_set_completed_at()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  _done boolean;
begin
  select s.category = 'completed' into _done
  from public.project_statuses s where s.id = new.status_id;

  if _done and (tg_op = 'INSERT' or old.completed_at is null) then
    new.completed_at := now();
  elsif not coalesce(_done, false) then
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger tasks_completed_at
  before insert or update of status_id on public.tasks
  for each row execute function private.tasks_set_completed_at();

-- Preenche as tarefas que já estão em colunas concluídas.
update public.tasks t set completed_at = t.updated_at
from public.project_statuses s
where s.id = t.status_id and s.category = 'completed' and t.completed_at is null;

-- ============================================================
-- 2. Fórum: dúvida resolvida (resposta que ajudou)
-- ============================================================
alter table public.publications
  add column resolved_comment_id uuid
    references public.publication_comments(id) on delete set null,
  add column resolved_at timestamptz;

create index publications_resolved_comment_idx
  on public.publications (resolved_comment_id)
  where resolved_comment_id is not null;

-- A resposta marcada precisa ser desta publicação e de outra pessoa.
-- (Só o autor consegue fazer update: a policy publications_update já garante.)
create or replace function private.publications_check_resolved()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.resolved_comment_id is distinct from old.resolved_comment_id then
    if new.resolved_comment_id is null then
      new.resolved_at := null;
    else
      if not exists (
        select 1 from public.publication_comments c
        where c.id = new.resolved_comment_id
          and c.publication_id = new.id
          and c.user_id <> new.user_id
      ) then
        raise exception 'A resposta marcada precisa ser de outra pessoa nesta publicação';
      end if;
      new.resolved_at := now();
    end if;
  end if;
  return new;
end;
$$;

create trigger publications_resolved
  before update of resolved_comment_id on public.publications
  for each row execute function private.publications_check_resolved();

-- ============================================================
-- 3. Vagas: tarefa para praticar o que falta
-- ============================================================
-- Tarefas "boa 1ª tarefa" livres que usam alguma das tecnologias pedidas.
-- security definer: quem não é membro do projeto também precisa ver a sugestão,
-- mas só recebe título, etiquetas e nome do projeto — nada além disso.
create or replace function public.suggest_practice_tasks(_skills text[], _limit int default 3)
returns table (task_id uuid, title text, labels text[], project_id uuid, project_name text)
language sql stable security definer set search_path = '' as $$
  select t.id, t.title, t.labels, p.id, p.name
  from public.tasks t
  join public.projects p on p.id = t.project_id and not p.is_archived
  join public.project_statuses s on s.id = t.status_id
  where t.good_first_task
    and t.assignee_id is null
    and s.category not in ('completed', 'canceled')
    and exists (
      select 1 from unnest(t.labels) l, unnest(_skills) k
      where lower(l) = lower(k)
    )
  order by t.created_at
  limit least(greatest(_limit, 1), 10);
$$;

revoke all on function public.suggest_practice_tasks(text[], int) from public;
grant execute on function public.suggest_practice_tasks(text[], int) to authenticated;

-- ============================================================
-- 4. Perfil: contribuições (contadores + linha do tempo)
-- ============================================================
-- Agrega dados que a RLS esconde de quem não é membro do projeto.
-- Expõe só: títulos de tarefas concluídas, nome do projeto, link do PR
-- e títulos de dúvidas resolvidas.
create or replace function public.profile_contributions(_user_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  with done as (
    select t.id, t.title, t.pr_url, t.pr_state, t.completed_at, p.id as project_id, p.name as project_name
    from public.tasks t
    join public.projects p on p.id = t.project_id
    where t.assignee_id = _user_id and t.completed_at is not null
  ),
  helped as (
    select pub.id, pub.title, pub.resolved_at
    from public.publications pub
    join public.publication_comments c on c.id = pub.resolved_comment_id
    where c.user_id = _user_id
  ),
  timeline as (
    select 'task' as kind, d.title, d.project_name as context, d.pr_url, d.completed_at as at from done d
    union all
    select 'answer', h.title, 'Fórum', null, h.resolved_at from helped h
  )
  select jsonb_build_object(
    'tasks_done', (select count(*) from done),
    'helpful_answers', (select count(*) from helped),
    'projects', (select count(distinct project_id) from done),
    'prs_merged', (select count(*) from done where pr_state = 'merged'),
    'timeline', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.at desc)
      from (select * from timeline order by at desc limit 20) x
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.profile_contributions(uuid) from public;
grant execute on function public.profile_contributions(uuid) to anon, authenticated;
