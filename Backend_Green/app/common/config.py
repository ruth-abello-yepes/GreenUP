## Archivo: config.py
## Modulo comun del backend: configuracion, conexion, seguridad o Swagger reutilizable.

import os
from dotenv import load_dotenv


load_dotenv()


DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DATABASE_URL = (
    os.getenv("DATABASE_URL")
    or os.getenv("SUPABASE_DB_URL")
    or os.getenv("POSTGRES_URL")
    or os.getenv("POSTGRESQL_URL")
)

JWT_EXPIRACION_MINUTOS = int(os.getenv("JWT_EXPIRACION_MINUTOS", "30"))
INACTIVIDAD_MINUTOS = int(os.getenv("INACTIVIDAD_MINUTOS", "20"))
LOGIN_IP_MAX_INTENTOS = int(os.getenv("LOGIN_IP_MAX_INTENTOS", "20"))
LOGIN_IP_VENTANA_SEGUNDOS = int(os.getenv("LOGIN_IP_VENTANA_SEGUNDOS", "900"))
