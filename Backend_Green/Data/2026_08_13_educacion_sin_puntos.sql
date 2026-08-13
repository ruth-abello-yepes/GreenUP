-- Educacion funciona como seguimiento formativo, no como programa de recompensas.
-- Se conservan las columnas para una futura etapa con aliados y verificacion,
-- pero ningun contenido o desafio educativo otorga puntos actualmente.

UPDATE contenido_educativo SET puntos = 0 WHERE puntos <> 0;
UPDATE desafio_educativo SET puntos = 0 WHERE puntos <> 0;
UPDATE progreso_contenido SET puntos_otorgados = 0 WHERE puntos_otorgados <> 0;
UPDATE usuario_desafio SET puntos_otorgados = 0 WHERE puntos_otorgados <> 0;
