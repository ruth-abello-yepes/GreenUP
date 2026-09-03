-- Conserva activas las cuentas existentes y exige verificación a las nuevas.
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS correo_verificado BOOLEAN NOT NULL DEFAULT TRUE;
