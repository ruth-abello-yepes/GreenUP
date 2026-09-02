-- Contenido de demostracion para Recicladora Mas Verde.
-- Idempotente: puede ejecutarse varias veces sin duplicar registros.

WITH punto AS (
    SELECT id_punto FROM puntos_reciclaje
    WHERE LOWER(nombre) LIKE '%verde%'
    ORDER BY id_punto LIMIT 1
), autor AS (
    SELECT u.id_usuario FROM usuarios u
    JOIN roles r ON r.id_rol = u.id_rol
    WHERE LOWER(r.nombre) IN ('administrador', 'admin')
    ORDER BY u.id_usuario LIMIT 1
)
INSERT INTO novedades (titulo, descripcion, imagen, id_usuario, id_estado, id_punto, motivo, comentario, ubicacion)
SELECT datos.titulo, datos.descripcion, datos.imagen, autor.id_usuario, 1, punto.id_punto,
       datos.motivo, datos.comentario, datos.ubicacion
FROM (VALUES
    ('Horario de atencion actualizado', 'Recibimos materiales de lunes a sabado, de 8:00 a. m. a 4:00 p. m. Trae tus residuos limpios, secos y separados.', NULL, 'Informacion del punto', 'Recicladora Mas Verde informa su horario de atencion a la comunidad.', 'Valledupar, Cesar'),
    ('Campana: separa tus aprovechables', 'Esta semana invitamos a la comunidad a separar plastico, carton, papel, vidrio y metal antes de llevarlos al punto.', NULL, 'Campana ambiental', 'Cada material separado correctamente facilita el aprovechamiento y reduce residuos en el relleno sanitario.', 'Valledupar, Cesar'),
    ('Gracias por reciclar con nosotros', 'Ya puedes consultar el estado de tus entregas desde tu historial. Nuestro equipo revisara cada registro y confirmara los materiales recibidos.', NULL, 'Comunidad GreenUp', 'Agradecimiento a las personas que participan en la red de reciclaje.', 'Recicladora Mas Verde')
) AS datos(titulo, descripcion, imagen, motivo, comentario, ubicacion)
CROSS JOIN punto CROSS JOIN autor
WHERE NOT EXISTS (
    SELECT 1 FROM novedades n
    WHERE n.id_punto = punto.id_punto AND LOWER(n.titulo) = LOWER(datos.titulo)
);

INSERT INTO preguntas_frecuentes (pregunta, respuesta, categoria, orden, id_estado)
SELECT datos.pregunta, datos.respuesta, datos.categoria, datos.orden, 1
FROM (VALUES
    ('Que materiales recibe Recicladora Mas Verde?', 'Recibimos plastico, carton, papel, vidrio, metal y residuos de aparatos electricos y electronicos segun disponibilidad.', 'Recicladora Mas Verde', 20),
    ('En que horario puedo llevar mis materiales?', 'Atendemos de lunes a sabado, de 8:00 a. m. a 4:00 p. m. Te recomendamos llevar los materiales limpios y secos.', 'Recicladora Mas Verde', 21),
    ('Como registro una entrega?', 'Ingresa a tu cuenta GreenUp, selecciona Registrar reciclaje, elige Recicladora Mas Verde, indica el material y la cantidad, y envia el registro.', 'Recicladora Mas Verde', 22),
    ('Cuando se confirma mi entrega?', 'El equipo de la recicladora revisa el material recibido. Cuando lo confirma, el registro aparece como confirmado en tu historial y actualiza tus estadisticas.', 'Recicladora Mas Verde', 23)
) AS datos(pregunta, respuesta, categoria, orden)
WHERE NOT EXISTS (
    SELECT 1 FROM preguntas_frecuentes p
    WHERE LOWER(p.pregunta) = LOWER(datos.pregunta)
);
