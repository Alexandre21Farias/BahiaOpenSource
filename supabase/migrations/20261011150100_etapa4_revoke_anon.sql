-- O Supabase concede EXECUTE direto ao anon em funções novas do schema public;
-- "revoke ... from public" não remove esse grant. Só o perfil é público.
revoke execute on function public.suggest_practice_tasks(text[], int) from anon;
revoke execute on function public.claim_good_first_task(uuid) from anon;
