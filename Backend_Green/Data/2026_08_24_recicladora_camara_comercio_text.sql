-- Archivo: 2026_08_24_recicladora_camara_comercio_text.sql
-- Objetivo: permitir guardar la Camara de Comercio como URL, nombre de archivo
-- o contenido serializado del archivo mientras se conecta Storage externo.

ALTER TABLE public.recicladoras
ALTER COLUMN camara_comercio TYPE text;
