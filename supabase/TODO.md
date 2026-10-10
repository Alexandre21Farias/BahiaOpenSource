# Pendências do banco (Supabase OpenBahia)

- [ ] Rodar `supabase/migrations/20261010180400_drop_legacy_policies_and_rewire_fks.sql` no SQL Editor
      (remove policies antigas, refaz FKs com cascade, restringe upload/listagem do bucket `publications`).
- [ ] Ativar "Leaked password protection" em Auth → Passwords (plano Pro).
- [ ] Avisar o Claude para rodar os advisors de segurança e performance e confirmar que zeraram.
- [ ] Publicar o front da branch `claude/supabase-db-improvements` (upload em `<user_id>/<uuid>`).
- [ ] Não reexecutar `…180100_*`, `…180200_*` e `…180300_*` no banco: já foram aplicados via execute_sql.
- [ ] Decidir depois: tabela de curtidas (`publication_likes`) e menções.
