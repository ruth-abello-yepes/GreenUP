-- El backend guarda la huella SHA-256 del codigo, que ocupa 64 caracteres.
-- Ampliar el campo conserva los datos existentes y permite generar nuevos codigos.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '15s';

ALTER TABLE public.codigos_recuperacion
ALTER COLUMN codigo TYPE VARCHAR(64);

COMMIT;
