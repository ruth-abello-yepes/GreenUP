## Archivo: database.py
## Modulo comun del backend: configuracion, conexion, seguridad o Swagger reutilizable.

import psycopg2
from psycopg2.extras import RealDictCursor
from app.common.config import DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

def obtener_conexion():
    conexion = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        dbname=DB_NAME,
        cursor_factory=RealDictCursor  # Para que las consultas devuelvan diccionarios JSON compatibles con Flask
    )
    return conexion