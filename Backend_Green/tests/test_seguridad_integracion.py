"""
Pruebas de integracion para seguridad, Supabase y flujo base de GreenUP.

Estas pruebas no crean datos de demostracion. Revisan que las protecciones
principales existan y que las rutas delicadas no acepten accesos sin sesion.
"""

import os
import sys
import unittest
from pathlib import Path

import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import RealDictCursor


BASE_BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_BACKEND))
load_dotenv(BASE_BACKEND / ".env")


class SeguridadIntegracionTest(unittest.TestCase):
    """Agrupa pruebas pequeñas que cubren los candados principales."""

    @classmethod
    def setUpClass(cls):
        """Prepara Flask y la conexion real a Supabase."""

        os.environ["GREENUP_PERMITIR_HEADERS_DEV"] = "false"
        from app import crear_app

        cls.app = crear_app()
        cls.cliente = cls.app.test_client()
        cls.conexion = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            cursor_factory=RealDictCursor,
        )

    @classmethod
    def tearDownClass(cls):
        """Cierra la conexion a Supabase al terminar."""

        cls.conexion.close()

    def test_rutas_protegidas_rechazan_peticion_sin_token(self):
        """Comprueba que rutas privadas no funcionen sin iniciar sesion."""

        rutas = [
            ("GET", "/api/notificaciones"),
            ("GET", "/reciclaje/mis-registros"),
            ("GET", "/api/recicladoras/perfil"),
            ("GET", "/reportes/reciclaje"),
        ]

        for metodo, ruta in rutas:
            with self.subTest(ruta=ruta):
                respuesta = self.cliente.open(ruta, method=metodo)
                self.assertEqual(respuesta.status_code, 401)

    def test_headers_falsificados_no_reemplazan_jwt(self):
        """Evita que alguien se haga pasar por admin usando headers manuales."""

        respuesta = self.cliente.post(
            "/materiales",
            json={"nombre": "Intento sin token", "unidad": "kg", "puntos_por_kg": 1},
            headers={"id_usuario": "1", "id_rol": "1"},
        )

        self.assertEqual(respuesta.status_code, 401)

    def test_supabase_tiene_rls_en_tablas_publicas(self):
        """Verifica que ninguna tabla publica quede sin Row Level Security."""

        with self.conexion.cursor() as cursor:
            cursor.execute(
                """
                SELECT relname
                FROM pg_class
                INNER JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
                WHERE pg_namespace.nspname = 'public'
                  AND pg_class.relkind = 'r'
                  AND pg_class.relrowsecurity = false
                ORDER BY relname
                """
            )
            tablas_sin_rls = [fila["relname"] for fila in cursor.fetchall()]

        self.assertEqual(tablas_sin_rls, [])

    def test_restricciones_unicas_principales_existen(self):
        """Comprueba unicidad de documento, correo, usuario y NIT."""

        restricciones = {
            "usuarios_correo_key",
            "usuarios_usuario_key",
            "usuarios_numero_documento_key",
            "recicladoras_nit_empresa_key",
        }

        with self.conexion.cursor() as cursor:
            cursor.execute(
                """
                SELECT conname
                FROM pg_constraint
                WHERE connamespace = 'public'::regnamespace
                  AND conname = ANY(%s)
                """,
                (list(restricciones),),
            )
            existentes = {fila["conname"] for fila in cursor.fetchall()}

        self.assertEqual(existentes, restricciones)

    def test_reciclaje_tiene_candados_de_cantidad_y_puntos(self):
        """Revisa checks para evitar cantidades invalidas y puntos negativos."""

        restricciones = {
            "chk_registrar_reciclaje_cantidad_positiva_greenup",
            "chk_registrar_reciclaje_puntos_no_negativos_greenup",
        }

        with self.conexion.cursor() as cursor:
            cursor.execute(
                """
                SELECT conname
                FROM pg_constraint
                WHERE connamespace = 'public'::regnamespace
                  AND conname = ANY(%s)
                """,
                (list(restricciones),),
            )
            existentes = {fila["conname"] for fila in cursor.fetchall()}

        self.assertEqual(existentes, restricciones)

    def test_preguntas_de_noticias_no_estan_duplicadas(self):
        """Confirma que no haya preguntas activas repetidas entre noticias."""

        with self.conexion.cursor() as cursor:
            cursor.execute(
                """
                SELECT LOWER(REGEXP_REPLACE(TRIM(pregunta), '\\s+', ' ', 'g')) AS pregunta,
                       COUNT(*) AS total
                FROM noticia_cuestionarios
                WHERE id_estado = 1
                GROUP BY 1
                HAVING COUNT(*) > 1
                """
            )
            duplicadas = cursor.fetchall()

        self.assertEqual(duplicadas, [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
