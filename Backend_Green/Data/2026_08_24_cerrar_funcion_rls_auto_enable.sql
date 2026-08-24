-- Archivo: 2026_08_24_cerrar_funcion_rls_auto_enable.sql
-- Objetivo: cerrar permisos publicos sobre la funcion auxiliar de RLS.
-- Esta funcion es administrativa y no debe ser ejecutable por visitantes ni usuarios comunes.

BEGIN;

REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;

COMMIT;
