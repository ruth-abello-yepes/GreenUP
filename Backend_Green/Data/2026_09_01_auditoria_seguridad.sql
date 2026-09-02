-- Auditoria minima de accesos y acciones sensibles. Idempotente.
BEGIN;

CREATE TABLE IF NOT EXISTS public.auditoria_seguridad (
    id_auditoria BIGSERIAL PRIMARY KEY,
    evento VARCHAR(80) NOT NULL,
    id_usuario BIGINT NULL REFERENCES public.usuarios(id_usuario) ON DELETE SET NULL,
    ip INET NULL,
    ruta VARCHAR(180) NULL,
    resultado VARCHAR(30) NOT NULL DEFAULT 'ok',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    detalle JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.auditoria_seguridad ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.auditoria_seguridad FROM anon, authenticated;
CREATE INDEX IF NOT EXISTS idx_auditoria_seguridad_fecha
    ON public.auditoria_seguridad (creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_seguridad_evento
    ON public.auditoria_seguridad (evento, creado_en DESC);

COMMIT;
