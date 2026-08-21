-- Archivo: 2026_08_21_materiales_puntos_existentes.sql
-- Objetivo: completar puntos antiguos que no tenían materiales aceptados.
-- Motivo: el formulario ciudadano ahora valida que el punto reciba el material.

INSERT INTO public.punto_material (id_punto, id_tipo_material)
SELECT
    puntos_reciclaje.id_punto,
    tipo_material.id_tipo_material
FROM public.puntos_reciclaje
CROSS JOIN public.tipo_material
WHERE puntos_reciclaje.id_estado = 1
  AND tipo_material.id_estado = 1
  AND NOT EXISTS (
      SELECT 1
      FROM public.punto_material existente
      WHERE existente.id_punto = puntos_reciclaje.id_punto
  )
ON CONFLICT (id_punto, id_tipo_material) DO NOTHING;
