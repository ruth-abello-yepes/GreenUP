-- Migracion de Supabase Storage para GreenUP.
-- Crea buckets con limites de archivo y tipos permitidos.

BEGIN;

-- Fotos de perfil: bucket publico, solo imagenes, maximo 2 MB.
INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES (
    'greenup-perfiles',
    'greenup-perfiles',
    true,
    2097152,
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Documentos de recicladoras: bucket privado, PDF o imagen, maximo 10 MB.
INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES (
    'greenup-documentos-recicladoras',
    'greenup-documentos-recicladoras',
    false,
    10485760,
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Lectura publica de fotos de perfil.
DROP POLICY IF EXISTS greenup_perfiles_lectura_publica ON storage.objects;
CREATE POLICY greenup_perfiles_lectura_publica
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'greenup-perfiles');

-- Cada usuario autenticado puede gestionar su propia carpeta en perfiles.
DROP POLICY IF EXISTS greenup_perfiles_usuario_gestiona_carpeta ON storage.objects;
CREATE POLICY greenup_perfiles_usuario_gestiona_carpeta
ON storage.objects
FOR ALL
TO authenticated
USING (
    bucket_id = 'greenup-perfiles'
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'greenup-perfiles'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Cada recicladora autenticada solo puede leer/escribir documentos de su carpeta.
DROP POLICY IF EXISTS greenup_documentos_recicladora_carpeta_privada ON storage.objects;
CREATE POLICY greenup_documentos_recicladora_carpeta_privada
ON storage.objects
FOR ALL
TO authenticated
USING (
    bucket_id = 'greenup-documentos-recicladoras'
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'greenup-documentos-recicladoras'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

COMMIT;
