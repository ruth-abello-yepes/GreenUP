-- Convierte el modulo de Educacion en un modulo dinamico y con progreso real.
-- La migracion es idempotente: puede ejecutarse mas de una vez.

ALTER TABLE contenido_educativo
    ALTER COLUMN id_usuario DROP NOT NULL,
    ALTER COLUMN imagen TYPE TEXT,
    ALTER COLUMN url_recurso TYPE TEXT;

ALTER TABLE contenido_educativo ADD COLUMN IF NOT EXISTS categoria VARCHAR(80) NOT NULL DEFAULT 'General';
ALTER TABLE contenido_educativo ADD COLUMN IF NOT EXISTS duracion_minutos INT NOT NULL DEFAULT 5;
ALTER TABLE contenido_educativo ADD COLUMN IF NOT EXISTS puntos INT NOT NULL DEFAULT 0;
ALTER TABLE contenido_educativo ADD COLUMN IF NOT EXISTS fuente VARCHAR(160);
ALTER TABLE contenido_educativo ADD COLUMN IF NOT EXISTS external_id VARCHAR(180);
ALTER TABLE contenido_educativo ADD COLUMN IF NOT EXISTS destacado BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE contenido_educativo ADD COLUMN IF NOT EXISTS origen VARCHAR(60) NOT NULL DEFAULT 'GreenUp';
ALTER TABLE contenido_educativo ADD COLUMN IF NOT EXISTS fecha_sincronizacion TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS uq_contenido_origen_external_id
    ON contenido_educativo (origen, external_id)
    WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contenido_educativo_publico
    ON contenido_educativo (id_estado, tipo, categoria, fecha_publicacion DESC);

ALTER TABLE tipo_material ADD COLUMN IF NOT EXISTS origen_material TEXT;
ALTER TABLE tipo_material ADD COLUMN IF NOT EXISTS preparacion TEXT;
ALTER TABLE tipo_material ADD COLUMN IF NOT EXISTS objetos_permitidos TEXT;
ALTER TABLE tipo_material ADD COLUMN IF NOT EXISTS objetos_no_permitidos TEXT;
ALTER TABLE tipo_material ADD COLUMN IF NOT EXISTS impacto_ambiental TEXT;
ALTER TABLE tipo_material ADD COLUMN IF NOT EXISTS imagen TEXT;
ALTER TABLE tipo_material ADD COLUMN IF NOT EXISTS fuente_url TEXT;

CREATE TABLE IF NOT EXISTS progreso_contenido (
    id_progreso SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    id_contenido INT NOT NULL REFERENCES contenido_educativo(id_contenido) ON DELETE CASCADE,
    fecha_completado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    puntos_otorgados INT NOT NULL DEFAULT 0,
    UNIQUE (id_usuario, id_contenido)
);

CREATE TABLE IF NOT EXISTS desafio_educativo (
    id_desafio SERIAL PRIMARY KEY,
    titulo VARCHAR(180) NOT NULL,
    descripcion TEXT NOT NULL,
    categoria VARCHAR(80) NOT NULL DEFAULT 'General',
    icono VARCHAR(60) NOT NULL DEFAULT 'eco',
    duracion_dias INT NOT NULL DEFAULT 1 CHECK (duracion_dias >= 1),
    puntos INT NOT NULL DEFAULT 0 CHECK (puntos >= 0),
    instrucciones TEXT,
    fecha_inicio DATE,
    fecha_fin DATE,
    id_estado INT NOT NULL DEFAULT 1 REFERENCES estado(id_estado),
    UNIQUE (titulo)
);

CREATE TABLE IF NOT EXISTS usuario_desafio (
    id_usuario_desafio SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    id_desafio INT NOT NULL REFERENCES desafio_educativo(id_desafio) ON DELETE CASCADE,
    estado VARCHAR(20) NOT NULL DEFAULT 'aceptado'
        CHECK (estado IN ('aceptado', 'completado')),
    fecha_aceptacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_completado TIMESTAMP,
    puntos_otorgados INT NOT NULL DEFAULT 0,
    UNIQUE (id_usuario, id_desafio)
);

CREATE TABLE IF NOT EXISTS sincronizacion_educacion (
    proveedor VARCHAR(80) PRIMARY KEY,
    fecha_ultimo_intento TIMESTAMP,
    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
    mensaje TEXT
);

-- Videos reales. Sus miniaturas son servidas por YouTube y el reproductor usa
-- el dominio youtube-nocookie.com (modo de privacidad mejorada).
INSERT INTO contenido_educativo (
    titulo, descripcion, tipo, url_recurso, imagen, id_estado, categoria,
    duracion_minutos, puntos, fuente, external_id, destacado, origen
) VALUES
(
    'Economia circular y reciclaje',
    'Conoce como la economia circular reduce el uso de materias primas, el consumo de energia y los residuos.',
    'video', 'https://www.youtube-nocookie.com/embed/46NGTbl0rec',
    'https://i.ytimg.com/vi/46NGTbl0rec/hqdefault.jpg', 1, 'Economia circular',
    26, 0, 'DW Espanol', '46NGTbl0rec', TRUE, 'YouTube'
),
(
    'Como separar los residuos en casa en Colombia',
    'Explicacion del codigo colombiano de colores para separar residuos aprovechables, organicos y no aprovechables.',
    'video', 'https://www.youtube-nocookie.com/embed/-5UxqleJeEU',
    'https://i.ytimg.com/vi/-5UxqleJeEU/hqdefault.jpg', 1, 'Separacion',
    3, 0, 'YouTube', '-5UxqleJeEU', FALSE, 'YouTube'
),
(
    'Como separar correctamente los residuos para reciclar',
    'Una guia audiovisual practica para reconocer contenedores y evitar contaminar los materiales reciclables.',
    'video', 'https://www.youtube-nocookie.com/embed/vQrXFn3dcOY',
    'https://i.ytimg.com/vi/vQrXFn3dcOY/hqdefault.jpg', 1, 'Separacion',
    8, 0, 'EcologiaVerde', 'vQrXFn3dcOY', FALSE, 'YouTube'
)
ON CONFLICT (origen, external_id) WHERE external_id IS NOT NULL DO UPDATE SET
    titulo = EXCLUDED.titulo,
    descripcion = EXCLUDED.descripcion,
    url_recurso = EXCLUDED.url_recurso,
    imagen = EXCLUDED.imagen,
    categoria = EXCLUDED.categoria,
    duracion_minutos = EXCLUDED.duracion_minutos,
    fuente = EXCLUDED.fuente,
    destacado = EXCLUDED.destacado,
    id_estado = 1;

-- Guias y recursos publicos oficiales de Colombia.
INSERT INTO contenido_educativo (
    titulo, descripcion, tipo, url_recurso, imagen, id_estado, categoria,
    duracion_minutos, puntos, fuente, external_id, destacado, origen
) VALUES
(
    'Guia nacional para separar residuos solidos',
    'Documento oficial con los tipos de residuos, el codigo de colores y recomendaciones para los hogares colombianos.',
    'guia', 'https://www.minambiente.gov.co/wp-content/uploads/2022/12/Guia_Residuos-Solidos_Digital.pdf',
    'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=900&q=80',
    1, 'Separacion', 12, 0, 'MinAmbiente y DNP', 'guia-residuos-colombia-2022', FALSE, 'GreenUp'
),
(
    'Codigo de colores para separar residuos en Colombia',
    'Aprende que depositar en los recipientes blanco, negro y verde, vigentes en todo el territorio nacional.',
    'guia', 'https://www.minambiente.gov.co/wp-content/uploads/2020/12/CODIGO_COLORES_VFF.pdf',
    'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?auto=format&fit=crop&w=900&q=80',
    1, 'Separacion', 6, 0, 'Ministerio de Ambiente', 'codigo-colores-colombia', FALSE, 'GreenUp'
),
(
    'Manejo responsable de residuos electronicos (RAEE)',
    'Informacion oficial sobre los riesgos, la gestion y el aprovechamiento de aparatos electricos y electronicos en Colombia.',
    'recurso', 'https://www.minambiente.gov.co/asuntos-ambientales-sectorial-y-urbana/residuos-de-aparato-electricos-y-electronicos-raee/',
    'https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=900&q=80',
    1, 'Electronicos', 8, 0, 'Ministerio de Ambiente', 'minambiente-raee', FALSE, 'GreenUp'
)
ON CONFLICT (origen, external_id) WHERE external_id IS NOT NULL DO UPDATE SET
    titulo = EXCLUDED.titulo,
    descripcion = EXCLUDED.descripcion,
    url_recurso = EXCLUDED.url_recurso,
    imagen = EXCLUDED.imagen,
    fuente = EXCLUDED.fuente,
    id_estado = 1;

INSERT INTO desafio_educativo (
    titulo, descripcion, categoria, icono, duracion_dias, puntos, instrucciones
) VALUES
('Cero bolsas plasticas', 'Evita bolsas plasticas de un solo uso durante tres dias.', 'Plasticos', 'shopping_bag', 3, 0, 'Lleva una bolsa reutilizable cuando hagas compras.'),
('Separa en tres colores', 'Aplica durante una semana el codigo blanco, negro y verde.', 'Separacion', 'delete_sweep', 7, 0, 'Ubica tres recipientes e informa a las personas de tu hogar.'),
('Entrega tus electronicos', 'Identifica un RAEE y llevalo a un punto autorizado.', 'Electronicos', 'devices', 1, 0, 'No desarmes ni deposites aparatos electronicos con residuos ordinarios.'),
('Composta en casa', 'Separa residuos organicos aprovechables e inicia un compost.', 'Organicos', 'compost', 7, 0, 'Usa restos vegetales crudos y evita carnes, aceites y lacteos.')
ON CONFLICT (titulo) DO UPDATE SET
    descripcion = EXCLUDED.descripcion,
    categoria = EXCLUDED.categoria,
    icono = EXCLUDED.icono,
    duracion_dias = EXCLUDED.duracion_dias,
    puntos = EXCLUDED.puntos,
    instrucciones = EXCLUDED.instrucciones,
    id_estado = 1;

UPDATE tipo_material SET
    origen_material = 'Envases y productos fabricados con polimeros derivados principalmente del petroleo.',
    preparacion = 'Vacia, enjuaga, seca y compacta los envases. Conserva la tapa solo si el punto la recibe.',
    objetos_permitidos = 'Botellas PET, envases de aseo PEAD y tapas limpias.',
    objetos_no_permitidos = 'Plasticos con comida, empaques metalizados, PVC o icopor cuando el punto no los acepte.',
    impacto_ambiental = 'Separarlo evita que llegue a rios y rellenos y permite reincorporar material a nuevos productos.',
    imagen = 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?auto=format&fit=crop&w=700&q=80',
    fuente_url = 'https://www.minambiente.gov.co/wp-content/uploads/2022/12/Guia_Residuos-Solidos_Digital.pdf'
WHERE id_estado = 1 AND nombre ILIKE '%pl%stic%';

UPDATE tipo_material SET
    origen_material = 'Fibras de celulosa provenientes de madera y papel recuperado.',
    preparacion = 'Mantenlo limpio y seco; aplana las cajas y retira restos de comida.',
    objetos_permitidos = 'Cajas, hojas, periodicos, revistas y empaques de carton limpios.',
    objetos_no_permitidos = 'Papel higienico, servilletas usadas, papel encerado o carton grasoso.',
    impacto_ambiental = 'Recuperar fibras reduce la demanda de materias primas y prolonga su ciclo de uso.',
    imagen = 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=700&q=80',
    fuente_url = 'https://www.minambiente.gov.co/wp-content/uploads/2022/12/Guia_Residuos-Solidos_Digital.pdf'
WHERE id_estado = 1 AND (nombre ILIKE '%cart%n%' OR nombre ILIKE '%papel%');

UPDATE tipo_material SET
    origen_material = 'Se produce fundiendo arena de silice con otros minerales a altas temperaturas.',
    preparacion = 'Vacia y enjuaga los recipientes; entrégalos sin residuos y evita romperlos.',
    objetos_permitidos = 'Botellas y frascos de vidrio.',
    objetos_no_permitidos = 'Espejos, bombillos, ceramica, loza y vidrio de ventanas.',
    impacto_ambiental = 'El vidrio de envases puede reciclarse repetidamente si se mantiene separado y limpio.',
    imagen = 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=700&q=80',
    fuente_url = 'https://www.minambiente.gov.co/wp-content/uploads/2022/12/Guia_Residuos-Solidos_Digital.pdf'
WHERE id_estado = 1 AND nombre ILIKE '%vidrio%';

UPDATE tipo_material SET
    origen_material = 'Minerales extraidos y transformados en acero, aluminio y otros metales de uso cotidiano.',
    preparacion = 'Vacia, enjuaga y aplasta las latas cuando sea seguro hacerlo.',
    objetos_permitidos = 'Latas de bebidas y alimentos, tapas metalicas y aluminio limpio.',
    objetos_no_permitidos = 'Envases con sustancias peligrosas, aerosoles llenos u objetos cortopunzantes expuestos.',
    impacto_ambiental = 'Recuperar metales reduce la extraccion minera y conserva energia frente a la produccion primaria.',
    imagen = 'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&w=700&q=80',
    fuente_url = 'https://www.minambiente.gov.co/wp-content/uploads/2022/12/Guia_Residuos-Solidos_Digital.pdf'
WHERE id_estado = 1 AND (nombre ILIKE '%metal%' OR nombre ILIKE '%aluminio%');

UPDATE tipo_material SET
    origen_material = 'Aceite usado en la preparacion de alimentos.',
    preparacion = 'Dejalo enfriar, filtralo y guardalo en una botella plastica bien cerrada.',
    objetos_permitidos = 'Aceite vegetal de cocina usado y libre de agua.',
    objetos_no_permitidos = 'Aceites de motor, lubricantes, agua o residuos de comida.',
    impacto_ambiental = 'Nunca debe ir al lavaplatos: su recoleccion evita contaminar agua y obstruir tuberias.',
    imagen = 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=700&q=80',
    fuente_url = 'https://www.minambiente.gov.co/wp-content/uploads/2022/12/Guia_Residuos-Solidos_Digital.pdf'
WHERE id_estado = 1 AND nombre ILIKE '%aceite%';

UPDATE tipo_material SET
    origen_material = 'Aparatos que funcionaron con electricidad, pilas o baterias y llegaron al final de su vida util.',
    preparacion = 'Borra datos personales, retira pilas removibles y entrega el equipo completo en un punto autorizado.',
    objetos_permitidos = 'Celulares, computadores, cables y pequeños electrodomesticos segun el programa posconsumo.',
    objetos_no_permitidos = 'Equipos desarmados, baterias perforadas o elementos mezclados con residuos ordinarios.',
    impacto_ambiental = 'La gestion especializada recupera materiales y evita liberar plomo, mercurio y otras sustancias peligrosas.',
    imagen = 'https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=700&q=80',
    fuente_url = 'https://www.minambiente.gov.co/asuntos-ambientales-sectorial-y-urbana/residuos-de-aparato-electricos-y-electronicos-raee/'
WHERE id_estado = 1 AND (nombre ILIKE '%RAEE%' OR nombre ILIKE '%electr%');
