-- Datos base obligatorios para que las pantallas de GreenUP no dependan
-- de una base Supabase vacia. Se puede ejecutar varias veces sin duplicar.

INSERT INTO estado (descripcion)
SELECT 'Activo'
WHERE NOT EXISTS (
    SELECT 1 FROM estado WHERE LOWER(descripcion) = 'activo'
);

INSERT INTO estado (descripcion)
SELECT 'Inactivo'
WHERE NOT EXISTS (
    SELECT 1 FROM estado WHERE LOWER(descripcion) = 'inactivo'
);

INSERT INTO roles (nombre, descripcion, id_estado)
SELECT 'Administrador', 'Gestiona todo el sistema GreenUP.', 1
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE LOWER(nombre) = 'administrador'
);

INSERT INTO roles (nombre, descripcion, id_estado)
SELECT 'Reciclador', 'Gestiona recicladoras y puntos ecologicos.', 1
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE LOWER(nombre) IN ('reciclador', 'recicladora')
);

INSERT INTO roles (nombre, descripcion, id_estado)
SELECT 'Ciudadano', 'Usuario que recicla y consulta contenido ambiental.', 1
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE LOWER(nombre) = 'ciudadano'
);

INSERT INTO tipo_documento (descripcion, id_estado)
SELECT documento, 1
FROM (VALUES
    ('Cedula de ciudadania'),
    ('Tarjeta de identidad'),
    ('Cedula de extranjeria'),
    ('NIT')
) AS base(documento)
WHERE NOT EXISTS (
    SELECT 1
    FROM tipo_documento td
    WHERE LOWER(td.descripcion) = LOWER(base.documento)
);

WITH residuos(nombre, descripcion, color_contenedor) AS (
    VALUES
        ('Aprovechables', 'Residuos secos reciclables como plastico, carton, vidrio y metal.', 'Blanco'),
        ('No aprovechables', 'Residuos ordinarios sin posibilidad de reciclaje.', 'Negro'),
        ('Organicos biodegradables', 'Restos de comida y desechos vegetales compostables.', 'Verde'),
        ('Peligrosos y RAEE', 'Pilas, baterias, electronicos y aceite usado.', 'Rojo')
)
INSERT INTO tipo_residuo (nombre, descripcion, color_contenedor, id_estado)
SELECT nombre, descripcion, color_contenedor, 1
FROM residuos
WHERE NOT EXISTS (
    SELECT 1
    FROM tipo_residuo tr
    WHERE LOWER(tr.nombre) = LOWER(residuos.nombre)
);

WITH materiales(nombre, descripcion, unidad, puntos_por_kg, residuo) AS (
    VALUES
        ('Plastico', 'Botellas, envases y empaques plasticos limpios.', 'kg', 10, 'Aprovechables'),
        ('Carton', 'Cajas y empaques de carton seco.', 'kg', 8, 'Aprovechables'),
        ('Papel', 'Papel limpio y seco.', 'kg', 7, 'Aprovechables'),
        ('Vidrio', 'Botellas y envases de vidrio.', 'kg', 6, 'Aprovechables'),
        ('Metal', 'Latas y chatarra metalica pequeña.', 'kg', 12, 'Aprovechables'),
        ('Organicos', 'Residuos biodegradables aptos para compostaje.', 'kg', 5, 'Organicos biodegradables'),
        ('RAEE', 'Residuos de aparatos electricos y electronicos.', 'kg', 15, 'Peligrosos y RAEE')
)
INSERT INTO tipo_material (nombre, descripcion, unidad, puntos_por_kg, id_tipo_residuo, id_estado)
SELECT
    materiales.nombre,
    materiales.descripcion,
    materiales.unidad,
    materiales.puntos_por_kg,
    tr.id_tipo_residuo,
    1
FROM materiales
LEFT JOIN tipo_residuo tr ON LOWER(tr.nombre) = LOWER(materiales.residuo)
WHERE NOT EXISTS (
    SELECT 1
    FROM tipo_material tm
    WHERE LOWER(tm.nombre) = LOWER(materiales.nombre)
);

WITH faq(pregunta, respuesta, categoria, orden) AS (
    VALUES
        ('Como recupero mi contrasena?', 'En la pantalla de inicio de sesion selecciona recuperar contrasena, escribe tu correo registrado y usa el codigo de seis digitos que llega al correo.', 'Cuenta', 1),
        ('Como registro un reciclaje?', 'Ingresa como ciudadano, abre la seccion de reciclaje, selecciona material, cantidad y punto ecologico disponible.', 'Reciclaje', 2),
        ('Por que no veo una recicladora en el mapa?', 'El mapa muestra recicladoras activas. Si una recicladora no tiene direccion completa, aparecera pendiente de completar ubicacion.', 'Mapa', 3),
        ('Quien valida las entregas?', 'La recicladora confirma la entrega y el sistema actualiza los registros asociados.', 'Operacion', 4)
)
INSERT INTO preguntas_frecuentes (pregunta, respuesta, categoria, orden, id_estado)
SELECT pregunta, respuesta, categoria, orden, 1
FROM faq
WHERE NOT EXISTS (
    SELECT 1
    FROM preguntas_frecuentes pf
    WHERE LOWER(pf.pregunta) = LOWER(faq.pregunta)
);
