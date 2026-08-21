-- Archivo: 2026_08_21_genero_usuario.sql
-- Objetivo: guardar el género solicitado en el registro ciudadano.
-- Valores permitidos por el formulario: Femenino, Masculino u Otro.

ALTER TABLE public.usuarios
ADD COLUMN IF NOT EXISTS genero character varying(20);

ALTER TABLE public.usuarios
DROP CONSTRAINT IF EXISTS chk_usuarios_genero_greenup;

ALTER TABLE public.usuarios
ADD CONSTRAINT chk_usuarios_genero_greenup
CHECK (
    genero IS NULL
    OR genero IN ('Femenino', 'Masculino', 'Otro')
);
