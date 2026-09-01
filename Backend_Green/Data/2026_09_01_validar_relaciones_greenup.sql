-- Las relaciones se crearon inicialmente como NOT VALID para no bloquear el
-- despliegue. Los datos actuales ya fueron comprobados y ahora se validan.
BEGIN;

ALTER TABLE public.ciudadano_puntos_juego VALIDATE CONSTRAINT fk_ciudadano_puntos_juego_usuario_greenup;
ALTER TABLE public.codigos_recuperacion VALIDATE CONSTRAINT fk_codigos_recuperacion_usuario_greenup;
ALTER TABLE public.noticia_cuestionarios VALIDATE CONSTRAINT fk_noticia_cuestionarios_noticia_greenup;
ALTER TABLE public.noticia_juego_intentos VALIDATE CONSTRAINT fk_noticia_juego_intentos_noticia_greenup;
ALTER TABLE public.noticia_juego_intentos VALIDATE CONSTRAINT fk_noticia_juego_intentos_usuario_greenup;
ALTER TABLE public.progreso_contenido VALIDATE CONSTRAINT fk_progreso_contenido_contenido_greenup;
ALTER TABLE public.progreso_contenido VALIDATE CONSTRAINT fk_progreso_contenido_usuario_greenup;
ALTER TABLE public.usuario_desafio VALIDATE CONSTRAINT fk_usuario_desafio_desafio_greenup;
ALTER TABLE public.usuario_desafio VALIDATE CONSTRAINT fk_usuario_desafio_usuario_greenup;

COMMIT;
