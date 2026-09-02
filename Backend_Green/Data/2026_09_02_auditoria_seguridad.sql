CREATE TABLE IF NOT EXISTS auditoria_seguridad (
    id_auditoria BIGSERIAL PRIMARY KEY,
    evento VARCHAR(80) NOT NULL,
    id_usuario INTEGER NULL,
    ip INET NULL,
    user_agent VARCHAR(500) NULL,
    detalle TEXT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_seguridad_fecha
    ON auditoria_seguridad (creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_seguridad_usuario
    ON auditoria_seguridad (id_usuario);
