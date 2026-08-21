-- Archivo: 2026_08_21_seguridad_foro_y_funciones.sql
-- Objetivo: cerrar las tablas antiguas de foro y fijar el search_path de la funcion de reciclaje.
-- Esta migracion ayuda a reducir alertas de seguridad mostradas por Supabase.

ALTER TABLE IF EXISTS public.foro_temas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.foro_respuestas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS greenup_bloquea_foro_temas_publico ON public.foro_temas;
CREATE POLICY greenup_bloquea_foro_temas_publico
ON public.foro_temas
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS greenup_bloquea_foro_respuestas_publico ON public.foro_respuestas;
CREATE POLICY greenup_bloquea_foro_respuestas_publico
ON public.foro_respuestas
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

ALTER FUNCTION public.greenup_sync_registro_reciclaje()
SET search_path = public, pg_temp;
