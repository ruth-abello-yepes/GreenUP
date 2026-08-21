## Archivo: database.py
## Modulo comun del backend: configuracion, conexion, seguridad o Swagger reutilizable.

import psycopg2
from psycopg2.extras import RealDictCursor
from app.common.config import DATABASE_URL, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

def obtener_conexion():
    if DATABASE_URL:
        return psycopg2.connect(
            DATABASE_URL,
            cursor_factory=RealDictCursor,
            sslmode="require",
        )

    faltantes = [
        nombre for nombre, valor in {
            "DB_HOST": DB_HOST,
            "DB_PORT": DB_PORT,
            "DB_USER": DB_USER,
            "DB_PASSWORD": DB_PASSWORD,
            "DB_NAME": DB_NAME,
        }.items()
        if not valor
    ]
    if faltantes:
        raise RuntimeError(
            "Faltan variables de conexión a la base de datos: "
            + ", ".join(faltantes)
            + ". Configura DATABASE_URL/SUPABASE_DB_URL o las variables DB_* en Render."
        )

    conexion = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        dbname=DB_NAME,
        sslmode="require",
        cursor_factory=RealDictCursor  # Para que las consultas devuelvan diccionarios JSON compatibles con Flask
    )
    return conexion
