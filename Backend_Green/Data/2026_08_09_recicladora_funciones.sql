-- Migracion para completar funciones del administrador de recicladora.
-- Ejecutar en Supabase SQL Editor.

ALTER TABLE recicladoras
ADD COLUMN IF NOT EXISTS id_punto INT REFERENCES puntos_reciclaje(id_punto);

ALTER TABLE usuarios
ALTER COLUMN foto_perfil TYPE TEXT;

UPDATE recicladoras
SET id_punto = puntos_reciclaje.id_punto
FROM puntos_reciclaje
WHERE recicladoras.id_punto IS NULL
  AND (
    LOWER(TRIM(puntos_reciclaje.nombre)) = LOWER(TRIM(recicladoras.nombre_empresa))
    OR LOWER(TRIM(puntos_reciclaje.direccion)) = LOWER(TRIM(recicladoras.direccion_empresa))
  );

ALTER TABLE novedades
ADD COLUMN IF NOT EXISTS id_punto INT REFERENCES puntos_reciclaje(id_punto),
ADD COLUMN IF NOT EXISTS motivo VARCHAR(150),
ADD COLUMN IF NOT EXISTS comentario TEXT,
ADD COLUMN IF NOT EXISTS ubicacion VARCHAR(255),
ADD COLUMN IF NOT EXISTS respuesta TEXT,
ADD COLUMN IF NOT EXISTS fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_novedades_id_punto ON novedades(id_punto);
CREATE INDEX IF NOT EXISTS idx_registrar_reciclaje_id_punto ON registrar_reciclaje(id_punto);

CREATE TABLE IF NOT EXISTS notificaciones (
    id_notificacion SERIAL PRIMARY KEY,
    id_usuario INT REFERENCES usuarios(id_usuario),
    id_rol INT REFERENCES roles(id_rol),
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT false,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_estado INT NOT NULL DEFAULT 1 REFERENCES estado(id_estado)
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(id_usuario);
CREATE INDEX IF NOT EXISTS idx_notificaciones_rol ON notificaciones(id_rol);

CREATE TABLE IF NOT EXISTS noticias (
    id_noticia SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    imagen VARCHAR(255),
    fecha_publicacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT REFERENCES usuarios(id_usuario),
    id_estado INT NOT NULL DEFAULT 1 REFERENCES estado(id_estado)
);

INSERT INTO noticias (titulo, descripcion, imagen, fecha_publicacion, id_usuario, id_estado)
SELECT titulo, descripcion, imagen, fecha_publicacion, id_usuario, id_estado
FROM novedades
WHERE id_punto IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM noticias
    WHERE noticias.titulo = novedades.titulo
      AND noticias.fecha_publicacion = novedades.fecha_publicacion
  );
