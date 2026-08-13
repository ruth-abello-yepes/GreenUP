-- Campos necesarios para conservar noticias ambientales de proveedores externos.
ALTER TABLE noticias
    ADD COLUMN IF NOT EXISTS url_original VARCHAR(1000),
    ADD COLUMN IF NOT EXISTS fuente VARCHAR(200),
    ADD COLUMN IF NOT EXISTS categoria VARCHAR(100) DEFAULT 'Medio ambiente',
    ADD COLUMN IF NOT EXISTS origen VARCHAR(50) DEFAULT 'GreenUp',
    ADD COLUMN IF NOT EXISTS fecha_sincronizacion TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS idx_noticias_url_original
    ON noticias (url_original)
    WHERE url_original IS NOT NULL;

CREATE TABLE IF NOT EXISTS sincronizacion_noticias (
    proveedor VARCHAR(50) PRIMARY KEY,
    fecha_ultimo_intento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(30) NOT NULL,
    mensaje TEXT
);
