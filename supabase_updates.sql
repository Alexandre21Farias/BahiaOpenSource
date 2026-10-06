-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar a coluna image_url na tabela publications
ALTER TABLE public.publications 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Criar um bucket de storage chamado 'publications' (se não existir)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('publications', 'publications', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Configurar políticas de segurança (RLS) para o bucket de publications
-- Permitir leitura para todos
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'publications');

-- Permitir upload apenas para usuários autenticados
CREATE POLICY "Authenticated users can upload images" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'publications' AND 
    auth.role() = 'authenticated'
);

-- Permitir exclusão apenas pelo dono do arquivo
CREATE POLICY "Users can delete own images" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'publications' AND 
    auth.uid() = owner
);
