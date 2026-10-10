-- Importacao de vagas de tecnologia (Remotive, RemoteOK, Jobicy).
-- Ja aplicado em producao via execute_sql; nao reexecutar.
-- Pre-requisito (ja habilitado): extensao pg_net.
-- As funcoes podem ser chamadas manualmente:
--   select private.fetch_job_feeds();   -- dispara as consultas HTTP
--   select private.process_job_feeds(); -- importa as respostas recebidas
-- O agendamento (pg_cron) esta no fim do arquivo.
-- As tres fontes exigem atribuicao (nome da fonte + link para a vaga original).

-- Vagas importadas nao tem autor humano
alter table public.jobs alter column user_id drop not null;
alter table public.jobs
  add column if not exists source text,
  add column if not exists external_id text,
  add column if not exists source_url text;

alter table public.jobs drop constraint jobs_job_type_check;
alter table public.jobs add constraint jobs_job_type_check
  check (job_type in ('clt','pj','estagio','freelance','voluntario','outro'));
alter table public.jobs add constraint jobs_source_check
  check (source is null or (external_id is not null and source in ('remotive','remoteok','jobicy')));
alter table public.jobs add constraint jobs_origin_check
  check (source is not null or user_id is not null);
create unique index jobs_source_external_idx on public.jobs (source, external_id) where source is not null;

create schema if not exists private;

create table private.job_import_requests (
  request_id bigint primary key,
  source text not null,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  result jsonb
);
revoke all on private.job_import_requests from public, anon, authenticated;

-- Algumas fontes entregam UTF-8 codificado duas vezes ("â\u0080\u0094" no lugar de "—")
create or replace function private.fix_text(t text) returns text
language plpgsql immutable set search_path = '' as $$
begin
  return convert_from(convert_to(t, 'LATIN1'), 'UTF8');
exception when others then
  return t;
end $$;

-- HTML -> texto simples (a vaga e exibida com white-space: pre-wrap)
create or replace function private.html_to_text(h text) returns text
language plpgsql immutable set search_path = '' as $$
declare t text := private.fix_text(coalesce(h, '')); m text;
begin
  t := regexp_replace(t, '<script.*?</script>', '', 'gi');
  t := regexp_replace(t, '<style.*?</style>', '', 'gi');
  t := regexp_replace(t, '</(p|div|h[1-6]|ul|ol|tr)>|<br\s*/?>', E'\n', 'gi');
  t := regexp_replace(t, '<li[^>]*>', E'\n• ', 'gi');
  t := regexp_replace(t, '<[^>]+>', '', 'g');
  t := replace(t, '&nbsp;', ' ');
  t := replace(t, '&lt;', '<');
  t := replace(t, '&gt;', '>');
  t := replace(t, '&quot;', '"');
  t := replace(t, '&#39;', '''');
  t := replace(t, '&#x27;', '''');
  t := replace(t, '&rsquo;', '’');
  t := replace(t, '&lsquo;', '‘');
  t := replace(t, '&ldquo;', '“');
  t := replace(t, '&rdquo;', '”');
  t := replace(t, '&ndash;', '–');
  t := replace(t, '&mdash;', '—');
  t := replace(t, '&hellip;', '…');
  t := replace(t, '&bull;', '•');
  for m in select distinct (regexp_matches(t, '&#([0-9]{2,5});', 'g'))[1] loop
    t := replace(t, '&#' || m || ';', chr(m::int));
  end loop;
  t := replace(t, '&amp;', '&');
  t := regexp_replace(t, E'[ \\t]+\\n', E'\n', 'g');
  t := regexp_replace(t, E'\\n{3,}', E'\n\n', 'g');
  return left(btrim(t, E' \n\t'), 4900);
end $$;

-- Aceita candidatos do Brasil? (vazio/"remote"/worldwide/LATAM/Americas/Brasil)
create or replace function private.accepts_brazil(loc text) returns boolean
language sql immutable set search_path = '' as $$
  select btrim(coalesce(loc, '')) = ''
      or lower(btrim(loc)) in ('remote', 'remoto', 'home office')
      or lower(loc) ~ '\y(worldwide|anywhere|global|latam|latin america|south america|americas|brazil|brasil)\y'
$$;

create or replace function private.level_from_title(title text, hint text default null) returns text
language sql immutable set search_path = '' as $$
  select case
    when lower(coalesce(hint, '') || ' ' || title) ~ '\y(intern|internship|estagi[aá]rio|est[aá]gio|trainee)\y' then 'estagio'
    when lower(coalesce(hint, '') || ' ' || title) ~ '\y(junior|j[uú]nior|jr|entry)\y' then 'junior'
    when lower(coalesce(hint, '') || ' ' || title) ~ '\y(senior|s[eê]nior|sr|staff|principal|lead)\y' then 'senior'
    when lower(coalesce(hint, '') || ' ' || title) ~ '\y(mid|midweight|pleno|intermediate)\y' then 'pleno'
    else null end
$$;

create or replace function private.clean_tags(tags text[]) returns text[]
language sql immutable set search_path = '' as $$
  select coalesce((
    select array_agg(t) from (
      select distinct on (t) t from (
        select left(lower(btrim(x)), 24) as t from unnest(tags) x
      ) s
      where t <> '' and t not in ('dev','remote','full time','engineer','exec','non tech','digital nomad')
      limit 10
    ) d
  ), '{}')
$$;

-- Converte o JSON de uma fonte em vagas. Retorna {importadas, ignoradas}.
create or replace function private.import_feed(_source text, _body jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  e jsonb; n_ok int := 0; n_skip int := 0;
  v_id text; v_title text; v_company text; v_desc text; v_loc text; v_url text;
  v_type text; v_level text; v_salary text; v_tags text[]; v_date timestamptz;
  tech_title constant text := '\y(developer|engineer|engineering|software|devops|sre|programmer|backend|frontend|full[- ]?stack|data scientist|data engineer|data analyst|machine learning|qa|sdet|cloud|architect|android|ios|mobile|python|java|javascript|typescript|react|node|golang|rust|php|ruby|sysadmin|infrastructure|platform|dba|cto|tech lead|technical lead)\y';
  tech_ind constant text[] := array['Software Engineering','DevOps & Infrastructure','Data Science & Analytics','QA & Testing','Cybersecurity','Web, UI & UX Design'];
begin
  for e in
    select x from jsonb_array_elements(
      case _source when 'remotive' then _body->'jobs'
                   when 'jobicy' then _body->'jobs'
                   else _body end) x
  loop
    begin
      if _source = 'remotive' then
        if lower(coalesce(e->>'category', '')) !~ '(software|devops|artificial intelligence|data|information technology|qa)' then
          n_skip := n_skip + 1; continue;
        end if;
        v_id := e->>'id'; v_title := e->>'title'; v_company := e->>'company_name';
        v_desc := private.html_to_text(e->>'description'); v_loc := e->>'candidate_required_location';
        v_url := e->>'url'; v_date := (e->>'publication_date')::timestamptz;
        v_type := case e->>'job_type' when 'contract' then 'pj' when 'freelance' then 'freelance' else 'outro' end;
        v_salary := nullif(left(e->>'salary', 60), '');
        v_tags := private.clean_tags(array(select jsonb_array_elements_text(coalesce(e->'tags', '[]'))));
        v_level := private.level_from_title(v_title);
      elsif _source = 'remoteok' then
        continue when e ? 'legal';
        v_id := e->>'id'; v_title := e->>'position'; v_company := e->>'company';
        v_desc := private.html_to_text(e->>'description'); v_loc := e->>'location';
        v_url := e->>'url'; v_date := (e->>'date')::timestamptz;
        v_tags := array(select jsonb_array_elements_text(coalesce(e->'tags', '[]')));
        if lower(v_title) !~ tech_title then n_skip := n_skip + 1; continue; end if;
        v_type := case when 'contract' = any (v_tags) then 'pj' when 'freelance' = any (v_tags) then 'freelance' else 'outro' end;
        v_salary := case when coalesce((e->>'salary_min')::numeric, 0) > 0
          then 'US$ ' || round((e->>'salary_min')::numeric / 1000) || 'k – ' || round(coalesce((e->>'salary_max')::numeric, (e->>'salary_min')::numeric) / 1000) || 'k/ano' end;
        v_tags := private.clean_tags(v_tags);
        v_level := private.level_from_title(v_title);
        v_loc := coalesce(nullif(btrim(v_loc), ''), 'Remoto');
      else -- jobicy
        v_id := e->>'id'; v_title := e->>'jobTitle'; v_company := e->>'companyName';
        v_desc := private.html_to_text(coalesce(e->>'jobDescription', e->>'jobExcerpt'));
        v_loc := e->>'jobGeo'; v_url := e->>'url'; v_date := (e->>'pubDate')::timestamptz;
        if not (array(select jsonb_array_elements_text(coalesce(e->'jobIndustry', '[]'))) && tech_ind) then
          n_skip := n_skip + 1; continue;
        end if;
        v_type := case
          when e->'jobType' ? 'Contract' then 'pj' when e->'jobType' ? 'Freelance' then 'freelance'
          when e->'jobType' ? 'Internship' then 'estagio' else 'outro' end;
        v_salary := case when coalesce((e->>'annualSalaryMin')::numeric, 0) > 0
          then coalesce(e->>'salaryCurrency', 'USD') || ' ' || round((e->>'annualSalaryMin')::numeric / 1000) || 'k – ' || round(coalesce((e->>'annualSalaryMax')::numeric, (e->>'annualSalaryMin')::numeric) / 1000) || 'k/ano' end;
        v_tags := '{}';
        v_level := private.level_from_title(v_title, e->>'jobLevel');
      end if;

      v_title := private.fix_text(v_title); v_company := private.fix_text(v_company); v_loc := regexp_replace(btrim(private.fix_text(v_loc)), '\s{2,}', ' ', 'g');
      if not private.accepts_brazil(v_loc) or v_url !~* '^https?://' or v_id is null then
        n_skip := n_skip + 1; continue;
      end if;
      if char_length(coalesce(v_desc, '')) < 10 then v_desc := v_title || ' — veja os detalhes na página da vaga.'; end if;

      insert into public.jobs (user_id, source, external_id, source_url, apply_url, title, company, description,
                               location, work_mode, job_type, level, salary, tags, created_at, expires_at)
      values (null, _source, v_id, v_url, v_url, left(v_title, 120), left(v_company, 80), v_desc,
              left(v_loc, 80), 'remote', v_type, v_level, v_salary, v_tags,
              least(coalesce(v_date, now()), now()), now() + interval '14 days')
      on conflict (source, external_id) where source is not null do update set
        title = excluded.title, company = excluded.company, description = excluded.description,
        location = excluded.location, job_type = excluded.job_type, level = excluded.level,
        salary = excluded.salary, tags = excluded.tags, apply_url = excluded.apply_url,
        source_url = excluded.source_url, is_open = true, expires_at = excluded.expires_at;
      n_ok := n_ok + 1;
    exception when others then
      n_skip := n_skip + 1;
    end;
  end loop;
  return jsonb_build_object('importadas', n_ok, 'ignoradas', n_skip);
end $$;

-- Dispara as consultas (limite do Remotive: ~4 chamadas por dia)
create or replace function private.fetch_job_feeds() returns void
language plpgsql security definer set search_path = '' as $$
declare
  ua constant jsonb := '{"User-Agent":"OpenBahia/1.0 (comunidade Bahia Open Source)"}';
  u record;
begin
  for u in
    select * from (values
      ('remotive', 'https://remotive.com/api/remote-jobs'),
      ('remoteok', 'https://remoteok.com/api'),
      ('jobicy',   'https://jobicy.com/api/v2/remote-jobs?count=50&geo=brazil'),
      ('jobicy',   'https://jobicy.com/api/v2/remote-jobs?count=50&geo=latam')
    ) as t(source, url)
  loop
    insert into private.job_import_requests (request_id, source)
    values (net.http_get(u.url, headers := ua, timeout_milliseconds := 30000), u.source);
  end loop;
end $$;

-- Processa respostas ja recebidas
create or replace function private.process_job_feeds() returns void
language plpgsql security definer set search_path = '' as $$
declare r record; res jsonb;
begin
  for r in
    select q.request_id, q.source, q.requested_at, h.status_code, h.content
    from private.job_import_requests q
    left join net._http_response h on h.id = q.request_id
    where q.processed_at is null
  loop
    if r.status_code is null then
      if r.requested_at < now() - interval '1 hour' then
        update private.job_import_requests set processed_at = now(), result = '{"erro":"sem resposta"}'
        where request_id = r.request_id;
      end if;
      continue;
    end if;
    begin
      if r.status_code = 200 then res := private.import_feed(r.source, r.content::jsonb);
      else res := jsonb_build_object('erro', 'http ' || r.status_code); end if;
    exception when others then
      res := jsonb_build_object('erro', sqlerrm);
    end;
    update private.job_import_requests set processed_at = now(), result = res where request_id = r.request_id;
  end loop;
end $$;

revoke all on function private.import_feed(text, jsonb), private.fetch_job_feeds(), private.process_job_feeds()
  from public, anon, authenticated;

-- Usuarios comuns nao podem se passar por vaga importada
alter policy jobs_insert on public.jobs
  with check (user_id = (select auth.uid()) and source is null and external_id is null and source_url is null);
alter policy jobs_update on public.jobs
  with check (user_id = (select auth.uid()) and source is null and external_id is null and source_url is null);

-- Agendamento automatico (aplicado em producao via execute_sql)
--  * busca 2x/dia: 09:17 e 21:17 UTC (Remotive aceita ~4 consultas/dia; Jobicy 1/hora)
--  * processa as respostas a cada 5 min (so trabalha se houver requisicao pendente)
-- Para pausar:  select cron.alter_job((select jobid from cron.job where jobname = 'jobs-fetch-feeds'), active := false);
select cron.schedule('jobs-fetch-feeds', '17 9,21 * * *', 'select private.fetch_job_feeds()');
select cron.schedule('jobs-process-feeds', '*/5 * * * *', 'select private.process_job_feeds()');
