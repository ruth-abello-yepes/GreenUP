-- Archivo: 2026_08_21_validar_usuario_documento_unico.sql
-- Objetivo: impedir usuarios menores de 5 caracteres y documentos duplicados.

CREATE OR REPLACE FUNCTION public.greenup_validar_usuario_unico()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  documento_normalizado text;
BEGIN
  NEW.usuario := TRIM(COALESCE(NEW.usuario, ''));
  NEW.correo := LOWER(TRIM(COALESCE(NEW.correo, '')));
  NEW.numero_documento := REGEXP_REPLACE(TRIM(COALESCE(NEW.numero_documento, '')), '[^0-9A-Za-z]', '', 'g');

  documento_normalizado := LOWER(NEW.numero_documento);

  IF LENGTH(NEW.usuario) < 5 THEN
    RAISE EXCEPTION 'El usuario debe tener minimo 5 caracteres';
  END IF;

  IF LENGTH(documento_normalizado) < 5 THEN
    RAISE EXCEPTION 'El numero de documento debe tener minimo 5 digitos';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.usuarios
    WHERE LOWER(TRIM(usuario)) = LOWER(NEW.usuario)
      AND id_usuario <> COALESCE(NEW.id_usuario, 0)
  ) THEN
    RAISE EXCEPTION 'El usuario ya se encuentra registrado';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.usuarios
    WHERE LOWER(TRIM(correo)) = NEW.correo
      AND id_usuario <> COALESCE(NEW.id_usuario, 0)
  ) THEN
    RAISE EXCEPTION 'El correo ya se encuentra registrado';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.usuarios
    WHERE LOWER(REGEXP_REPLACE(TRIM(numero_documento), '[^0-9A-Za-z]', '', 'g')) = documento_normalizado
      AND id_usuario <> COALESCE(NEW.id_usuario, 0)
  ) THEN
    RAISE EXCEPTION 'El numero de documento ya se encuentra registrado';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_greenup_validar_usuario_unico ON public.usuarios;

CREATE TRIGGER trg_greenup_validar_usuario_unico
BEFORE INSERT OR UPDATE OF usuario, correo, numero_documento
ON public.usuarios
FOR EACH ROW
EXECUTE FUNCTION public.greenup_validar_usuario_unico();
