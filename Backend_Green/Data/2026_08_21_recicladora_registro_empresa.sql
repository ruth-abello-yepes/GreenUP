-- Archivo: 2026_08_21_recicladora_registro_empresa.sql
-- Objetivo: guardar datos empresariales completos de la recicladora.
-- Estos campos permiten mostrar horarios y estado de validacion en el sistema.

ALTER TABLE public.recicladoras
ADD COLUMN IF NOT EXISTS horario character varying(120),
ADD COLUMN IF NOT EXISTS dias_trabajo text,
ADD COLUMN IF NOT EXISTS hora_inicio time,
ADD COLUMN IF NOT EXISTS hora_fin time,
ADD COLUMN IF NOT EXISTS dias_no_trabaja text,
ADD COLUMN IF NOT EXISTS estado_validacion_nit character varying(30) DEFAULT 'pendiente',
ADD COLUMN IF NOT EXISTS estado_camara_comercio character varying(30) DEFAULT 'pendiente';

ALTER TABLE public.recicladoras
DROP CONSTRAINT IF EXISTS chk_recicladoras_validacion_nit_greenup;

ALTER TABLE public.recicladoras
ADD CONSTRAINT chk_recicladoras_validacion_nit_greenup
CHECK (estado_validacion_nit IN ('pendiente', 'validado', 'rechazado'));

ALTER TABLE public.recicladoras
DROP CONSTRAINT IF EXISTS chk_recicladoras_camara_greenup;

ALTER TABLE public.recicladoras
ADD CONSTRAINT chk_recicladoras_camara_greenup
CHECK (estado_camara_comercio IN ('pendiente', 'validado', 'rechazado'));
