-- Migracion de integridad relacional GreenUP.
-- Protege registros nuevos sin eliminar datos reales existentes.

BEGIN;

-- Relaciona puntos de juego con usuarios reales.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_ciudadano_puntos_juego_usuario_greenup'
    ) THEN
        ALTER TABLE public.ciudadano_puntos_juego
        ADD CONSTRAINT fk_ciudadano_puntos_juego_usuario_greenup
        FOREIGN KEY (id_usuario)
        REFERENCES public.usuarios(id_usuario)
        ON DELETE CASCADE
        NOT VALID;
    END IF;
END $$;

-- Relaciona preguntas con noticias reales.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_noticia_cuestionarios_noticia_greenup'
    ) THEN
        ALTER TABLE public.noticia_cuestionarios
        ADD CONSTRAINT fk_noticia_cuestionarios_noticia_greenup
        FOREIGN KEY (id_noticia)
        REFERENCES public.noticias(id_noticia)
        ON DELETE CASCADE
        NOT VALID;
    END IF;
END $$;

-- Relaciona intentos del juego con usuario y noticia.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_noticia_juego_intentos_usuario_greenup'
    ) THEN
        ALTER TABLE public.noticia_juego_intentos
        ADD CONSTRAINT fk_noticia_juego_intentos_usuario_greenup
        FOREIGN KEY (id_usuario)
        REFERENCES public.usuarios(id_usuario)
        ON DELETE CASCADE
        NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_noticia_juego_intentos_noticia_greenup'
    ) THEN
        ALTER TABLE public.noticia_juego_intentos
        ADD CONSTRAINT fk_noticia_juego_intentos_noticia_greenup
        FOREIGN KEY (id_noticia)
        REFERENCES public.noticias(id_noticia)
        ON DELETE CASCADE
        NOT VALID;
    END IF;
END $$;

-- Relaciona codigos de recuperacion con usuarios.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_codigos_recuperacion_usuario_greenup'
    ) THEN
        ALTER TABLE public.codigos_recuperacion
        ADD CONSTRAINT fk_codigos_recuperacion_usuario_greenup
        FOREIGN KEY (id_usuario)
        REFERENCES public.usuarios(id_usuario)
        ON DELETE CASCADE
        NOT VALID;
    END IF;
END $$;

-- Relaciona progreso educativo con usuarios y contenidos.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_progreso_contenido_usuario_greenup'
    ) THEN
        ALTER TABLE public.progreso_contenido
        ADD CONSTRAINT fk_progreso_contenido_usuario_greenup
        FOREIGN KEY (id_usuario)
        REFERENCES public.usuarios(id_usuario)
        ON DELETE CASCADE
        NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_progreso_contenido_contenido_greenup'
    ) THEN
        ALTER TABLE public.progreso_contenido
        ADD CONSTRAINT fk_progreso_contenido_contenido_greenup
        FOREIGN KEY (id_contenido)
        REFERENCES public.contenido_educativo(id_contenido)
        ON DELETE CASCADE
        NOT VALID;
    END IF;
END $$;

-- Relaciona desafios aceptados/completados con usuario y desafio.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_usuario_desafio_usuario_greenup'
    ) THEN
        ALTER TABLE public.usuario_desafio
        ADD CONSTRAINT fk_usuario_desafio_usuario_greenup
        FOREIGN KEY (id_usuario)
        REFERENCES public.usuarios(id_usuario)
        ON DELETE CASCADE
        NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_usuario_desafio_desafio_greenup'
    ) THEN
        ALTER TABLE public.usuario_desafio
        ADD CONSTRAINT fk_usuario_desafio_desafio_greenup
        FOREIGN KEY (id_desafio)
        REFERENCES public.desafio_educativo(id_desafio)
        ON DELETE CASCADE
        NOT VALID;
    END IF;
END $$;

-- Indices para las relaciones agregadas.
CREATE INDEX IF NOT EXISTS idx_noticia_juego_intentos_usuario_fecha_greenup
ON public.noticia_juego_intentos (id_usuario, fecha_resolucion DESC);

CREATE INDEX IF NOT EXISTS idx_progreso_contenido_usuario_greenup
ON public.progreso_contenido (id_usuario, id_contenido);

CREATE INDEX IF NOT EXISTS idx_usuario_desafio_usuario_estado_greenup
ON public.usuario_desafio (id_usuario, estado);

CREATE INDEX IF NOT EXISTS idx_codigos_recuperacion_usuario_expira_greenup
ON public.codigos_recuperacion (id_usuario, expiracion DESC);

COMMIT;
