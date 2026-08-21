-- Migracion de unicidad fuerte GreenUP.
-- Evita duplicados aunque cambien mayusculas, minusculas o espacios.

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_correo_normalizado_greenup
ON public.usuarios (LOWER(TRIM(correo)));

CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_usuario_normalizado_greenup
ON public.usuarios (LOWER(TRIM(usuario)));

CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_documento_normalizado_greenup
ON public.usuarios (LOWER(TRIM(numero_documento)));

CREATE UNIQUE INDEX IF NOT EXISTS uq_recicladoras_nit_normalizado_greenup
ON public.recicladoras (LOWER(TRIM(nit_empresa)));

COMMIT;
