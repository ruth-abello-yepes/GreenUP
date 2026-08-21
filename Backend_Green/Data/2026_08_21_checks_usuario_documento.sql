-- Archivo: 2026_08_21_checks_usuario_documento.sql
-- Objetivo: reforzar reglas minimas de usuario y documento desde Supabase.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_usuarios_usuario_minimo_greenup'
  ) THEN
    ALTER TABLE public.usuarios
    ADD CONSTRAINT chk_usuarios_usuario_minimo_greenup
    CHECK (LENGTH(TRIM(usuario)) >= 5);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_usuarios_documento_minimo_greenup'
  ) THEN
    ALTER TABLE public.usuarios
    ADD CONSTRAINT chk_usuarios_documento_minimo_greenup
    CHECK (LENGTH(REGEXP_REPLACE(TRIM(numero_documento), '[^0-9A-Za-z]', '', 'g')) >= 5);
  END IF;
END;
$$;
