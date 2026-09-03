-- Permite que cada recicladora informe si recoge reciclables en los domicilios.
ALTER TABLE recicladoras
ADD COLUMN IF NOT EXISTS ofrece_recoleccion_domicilio BOOLEAN NOT NULL DEFAULT FALSE;
