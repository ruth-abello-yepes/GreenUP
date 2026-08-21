-- Migracion de auditoria tecnica GreenUP.
-- Objetivo: reforzar Supabase, reciclajes, Ecopuntos, preguntas e indices.
-- Ejecutar en Supabase SQL Editor o desde el backend con credenciales seguras.

BEGIN;

-- Estado 3 permite guardar reciclajes rechazados sin romper la llave foranea.
INSERT INTO public.estado (id_estado, descripcion)
VALUES (3, 'Rechazado')
ON CONFLICT (id_estado) DO NOTHING;

-- Evita cantidades invalidas en registros reales de reciclaje.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_registrar_reciclaje_cantidad_positiva_greenup'
    ) THEN
        ALTER TABLE public.registrar_reciclaje
        ADD CONSTRAINT chk_registrar_reciclaje_cantidad_positiva_greenup
        CHECK (cantidad > 0);
    END IF;
END $$;

-- Evita que el sistema guarde Ecopuntos negativos.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_registrar_reciclaje_puntos_no_negativos_greenup'
    ) THEN
        ALTER TABLE public.registrar_reciclaje
        ADD CONSTRAINT chk_registrar_reciclaje_puntos_no_negativos_greenup
        CHECK (
            COALESCE(puntos_obtenidos, 0) >= 0
            AND COALESCE(puntos_otorgados, 0) >= 0
        );
    END IF;
END $$;

-- Reemplaza la funcion de sincronizacion con reglas anti doble confirmacion.
CREATE OR REPLACE FUNCTION public.greenup_sync_registro_reciclaje()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Mantiene iguales los dos campos de observacion usados por pantallas antiguas y nuevas.
    IF NEW.observacion IS DISTINCT FROM NEW.observaciones THEN
        IF TG_OP = 'INSERT' THEN
            NEW.observacion := COALESCE(NEW.observacion, NEW.observaciones);
            NEW.observaciones := COALESCE(NEW.observaciones, NEW.observacion);
        ELSE
            IF NEW.observacion IS DISTINCT FROM OLD.observacion THEN
                NEW.observaciones := NEW.observacion;
            ELSIF NEW.observaciones IS DISTINCT FROM OLD.observaciones THEN
                NEW.observacion := NEW.observaciones;
            ELSE
                NEW.observacion := COALESCE(NEW.observacion, NEW.observaciones);
                NEW.observaciones := COALESCE(NEW.observaciones, NEW.observacion);
            END IF;
        END IF;
    END IF;

    -- Pone valores seguros cuando el registro nace sin estado textual o numerico.
    IF TG_OP = 'INSERT' THEN
        NEW.id_estado := COALESCE(NEW.id_estado, 1);
        NEW.estado := COALESCE(NULLIF(NEW.estado, ''), 'pendiente');
    END IF;

    -- Traduce estado numerico a estado textual del flujo de reciclaje.
    IF NEW.id_estado = 1 THEN
        NEW.estado := COALESCE(NULLIF(NEW.estado, ''), 'pendiente');
    ELSIF NEW.id_estado = 2 THEN
        NEW.estado := 'confirmado';
        NEW.fecha_confirmacion := COALESCE(NEW.fecha_confirmacion, NOW());
    ELSIF NEW.id_estado = 3 THEN
        NEW.estado := 'rechazado';
        NEW.fecha_confirmacion := COALESCE(NEW.fecha_confirmacion, NOW());
    END IF;

    -- Traduce estado textual a estado numerico cuando llegue solo texto.
    IF LOWER(COALESCE(NEW.estado, '')) = 'confirmado' THEN
        NEW.id_estado := 2;
    ELSIF LOWER(COALESCE(NEW.estado, '')) = 'rechazado' THEN
        NEW.id_estado := 3;
    ELSIF LOWER(COALESCE(NEW.estado, '')) = 'pendiente' THEN
        NEW.id_estado := 1;
    END IF;

    -- Un registro rechazado no genera puntos.
    IF NEW.id_estado = 3 OR LOWER(COALESCE(NEW.estado, '')) = 'rechazado' THEN
        NEW.puntos_obtenidos := 0;
        NEW.puntos_otorgados := 0;
    END IF;

    -- Mantiene iguales puntos_obtenidos y puntos_otorgados.
    IF TG_OP = 'INSERT' THEN
        NEW.puntos_obtenidos := COALESCE(NEW.puntos_obtenidos, NEW.puntos_otorgados, 0);
        NEW.puntos_otorgados := COALESCE(NEW.puntos_otorgados, NEW.puntos_obtenidos, 0);
    ELSE
        IF OLD.id_estado IN (2, 3) OR LOWER(COALESCE(OLD.estado, '')) IN ('confirmado', 'rechazado') THEN
            IF NEW.id_estado IS DISTINCT FROM OLD.id_estado
               OR NEW.estado IS DISTINCT FROM OLD.estado
               OR NEW.puntos_obtenidos IS DISTINCT FROM OLD.puntos_obtenidos
               OR NEW.puntos_otorgados IS DISTINCT FROM OLD.puntos_otorgados THEN
                RAISE EXCEPTION 'Este reciclaje ya fue procesado y no puede cambiar estado ni puntos';
            END IF;
        END IF;

        IF NEW.puntos_obtenidos IS DISTINCT FROM OLD.puntos_obtenidos THEN
            NEW.puntos_otorgados := COALESCE(NEW.puntos_obtenidos, 0);
        ELSIF NEW.puntos_otorgados IS DISTINCT FROM OLD.puntos_otorgados THEN
            NEW.puntos_obtenidos := COALESCE(NEW.puntos_otorgados, 0);
        ELSE
            NEW.puntos_obtenidos := COALESCE(NEW.puntos_obtenidos, NEW.puntos_otorgados, 0);
            NEW.puntos_otorgados := COALESCE(NEW.puntos_otorgados, NEW.puntos_obtenidos, 0);
        END IF;
    END IF;

    IF NEW.puntos_obtenidos < 0 OR NEW.puntos_otorgados < 0 THEN
        RAISE EXCEPTION 'Los Ecopuntos no pueden ser negativos';
    END IF;

    RETURN NEW;
END;
$$;

-- Indices para consultas frecuentes del backend y pantallas principales.
CREATE INDEX IF NOT EXISTS idx_usuarios_rol_estado_greenup
ON public.usuarios (id_rol, id_estado);

CREATE INDEX IF NOT EXISTS idx_usuarios_auth_user_greenup
ON public.usuarios (auth_user_id)
WHERE auth_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recicladoras_usuario_punto_greenup
ON public.recicladoras (id_usuario, id_punto);

CREATE INDEX IF NOT EXISTS idx_recicladoras_estado_validacion_greenup
ON public.recicladoras (id_estado, estado_validacion_nit, estado_camara_comercio);

CREATE INDEX IF NOT EXISTS idx_puntos_estado_greenup
ON public.puntos_reciclaje (id_estado);

CREATE INDEX IF NOT EXISTS idx_reciclaje_usuario_estado_fecha_greenup
ON public.registrar_reciclaje (id_usuario, id_estado, fecha_hora DESC);

CREATE INDEX IF NOT EXISTS idx_reciclaje_punto_estado_fecha_greenup
ON public.registrar_reciclaje (id_punto, id_estado, fecha_hora DESC);

CREATE INDEX IF NOT EXISTS idx_reciclaje_material_fecha_greenup
ON public.registrar_reciclaje (id_tipo_material, fecha_hora DESC);

CREATE INDEX IF NOT EXISTS idx_notificaciones_destino_leida_fecha_greenup
ON public.notificaciones (id_usuario, id_rol, leida, fecha_hora DESC);

CREATE INDEX IF NOT EXISTS idx_noticias_estado_fecha_greenup
ON public.noticias (id_estado, fecha_publicacion DESC);

CREATE INDEX IF NOT EXISTS idx_noticia_cuestionarios_noticia_estado_greenup
ON public.noticia_cuestionarios (id_noticia, id_estado);

-- Evita preguntas duplicadas entre noticias cuando no existan duplicados activos.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.noticia_cuestionarios
        WHERE id_estado = 1
        GROUP BY LOWER(REGEXP_REPLACE(TRIM(pregunta), '\s+', ' ', 'g'))
        HAVING COUNT(*) > 1
    ) THEN
        CREATE UNIQUE INDEX IF NOT EXISTS uq_noticia_pregunta_unica_activa_greenup
        ON public.noticia_cuestionarios (
            LOWER(REGEXP_REPLACE(TRIM(pregunta), '\s+', ' ', 'g'))
        )
        WHERE id_estado = 1;
    END IF;
END $$;

-- Mantiene RLS activo en todas las tablas publicas expuestas por Supabase.
DO $$
DECLARE
    tabla RECORD;
BEGIN
    FOR tabla IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE FORMAT('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tabla.tablename);
    END LOOP;
END $$;

COMMIT;
