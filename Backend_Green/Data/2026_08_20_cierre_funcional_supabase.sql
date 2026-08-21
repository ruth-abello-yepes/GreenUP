-- Script de cierre funcional para GreenUP.
-- Este archivo documenta ajustes aplicados en Supabase para proteger datos
-- y evitar preguntas repetidas entre noticias.

-- Activa RLS en tablas antiguas del foro para que no queden expuestas.
ALTER TABLE IF EXISTS public.foro_temas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.foro_respuestas ENABLE ROW LEVEL SECURITY;

-- Evita que una misma pregunta activa se repita en dos noticias diferentes.
CREATE UNIQUE INDEX IF NOT EXISTS uq_greenup_pregunta_activa_unica
ON public.noticia_cuestionarios (
  LOWER(TRIM(REGEXP_REPLACE(pregunta, '\s+', ' ', 'g')))
)
WHERE id_estado = 1;

-- Mantiene segura la funcion de sincronizacion de reciclajes.
ALTER FUNCTION IF EXISTS public.greenup_sync_registro_reciclaje()
SET search_path = public, pg_temp;
