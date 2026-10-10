-- Bucket de avatares (faltava em producao)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']
where id = 'publications';

-- Buckets publicos servem a URL sem policy de SELECT; removela impede listar todos os arquivos
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload images" on storage.objects;
drop policy if exists "Users can delete own images" on storage.objects;

-- Dono = pasta "<uid>/" (novo) ou prefixo "<uid>_" (legado, mantido por compatibilidade)
create policy "Users upload own publication images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'publications'
  and ((storage.foldername(name))[1] = (select auth.uid())::text
       or name like (select auth.uid())::text || '\_%')
);
create policy "Users update own publication images"
on storage.objects for update to authenticated
using (bucket_id = 'publications' and owner = (select auth.uid()));
create policy "Users delete own publication images"
on storage.objects for delete to authenticated
using (bucket_id = 'publications' and owner = (select auth.uid()));

create policy "Users upload own avatar"
on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users update own avatar"
on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users delete own avatar"
on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
