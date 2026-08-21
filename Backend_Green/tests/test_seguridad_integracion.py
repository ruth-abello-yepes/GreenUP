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
BASE_PROYECTO = BASE_BACKEND.parent
sys.path.insert(0, str(BASE_BACKEND))
load_dotenv(BASE_PROYECTO / ".env")
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

    def test_escrituras_administrativas_requieren_token(self):
        """Comprueba que catalogos administrativos no acepten escritura publica."""

        rutas = [
            ("POST", "/materiales", {"nombre": "Prueba", "unidad": "kg", "puntos_por_kg": 1}),
            ("POST", "/tipos-residuo", {"nombre": "Prueba", "descripcion": "Temporal"}),
            ("POST", "/api/roles/registrar", {"nombre": "Temporal", "descripcion": "Temporal"}),
            ("POST", "/api/tipo-documento/registrar", {"descripcion": "Temporal"}),
            ("POST", "/noticias", {"titulo": "Temporal", "contenido": "Temporal"}),
            ("POST", "/faq", {"pregunta": "Temporal", "respuesta": "Temporal"}),
            ("POST", "/contenido", {"titulo": "Temporal", "tipo": "articulo", "id_usuario": 1}),
            ("POST", "/ubicaciones", {"nombre": "Temporal", "direccion": "Temporal"}),
        ]

        for metodo, ruta, cuerpo in rutas:
            with self.subTest(ruta=ruta):
                respuesta = self.cliente.open(ruta, method=metodo, json=cuerpo)
                self.assertEqual(respuesta.status_code, 401)

    def test_estadisticas_admin_requieren_administrador(self):
        """Evita que estadisticas globales queden visibles sin sesion."""

        respuesta = self.cliente.get("/estadisticas")

        self.assertEqual(respuesta.status_code, 401)

    def test_cors_permite_origen_local_del_frontend(self):
        """El backend acepta el origen local usado por Live Server."""

        respuesta = self.cliente.get(
            "/materiales",
            headers={"Origin": "http://127.0.0.1:5502"},
        )

        self.assertEqual(
            respuesta.headers.get("Access-Control-Allow-Origin"),
            "http://127.0.0.1:5502",
        )

    def test_cors_no_abre_cualquier_origen(self):
        """Evita que cualquier sitio externo pueda consumir el backend."""

        respuesta = self.cliente.get(
            "/materiales",
            headers={"Origin": "https://sitio-no-autorizado.example"},
        )

        self.assertIsNone(respuesta.headers.get("Access-Control-Allow-Origin"))

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

    def test_funciones_publicas_tienen_search_path(self):
        """Evita la alerta Function Search Path Mutable de Supabase."""

        with self.conexion.cursor() as cursor:
            cursor.execute(
                """
                SELECT proname
                FROM pg_proc funcion
                INNER JOIN pg_namespace esquema
                  ON esquema.oid = funcion.pronamespace
                WHERE esquema.nspname = 'public'
                  AND funcion.prokind = 'f'
                  AND NOT EXISTS (
                    SELECT 1
                    FROM unnest(COALESCE(funcion.proconfig, ARRAY[]::text[])) cfg
                    WHERE cfg LIKE 'search_path=%'
                  )
                ORDER BY proname
                """
            )
            funciones_sin_search_path = [fila["proname"] for fila in cursor.fetchall()]

        self.assertEqual(funciones_sin_search_path, [])

    def test_no_hay_policies_de_escritura_abiertas(self):
        """Comprueba que las escrituras por Data API no queden con condicion true."""

        with self.conexion.cursor() as cursor:
            cursor.execute(
                """
                SELECT tablename, policyname
                FROM pg_policies
                WHERE schemaname = 'public'
                  AND cmd IN ('ALL', 'INSERT', 'UPDATE', 'DELETE')
                  AND (
                    COALESCE(qual, '') = 'true'
                    OR COALESCE(with_check, '') = 'true'
                  )
                ORDER BY tablename, policyname
                """
            )
            policies_abiertas = cursor.fetchall()

        self.assertEqual(policies_abiertas, [])

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

    def test_checks_minimos_de_usuario_existen(self):
        """Comprueba reglas de longitud minima para usuario y documento."""

        restricciones = {
            "chk_usuarios_usuario_minimo_greenup",
            "chk_usuarios_documento_minimo_greenup",
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

    def test_indices_unicos_normalizados_existen(self):
        """Comprueba unicidad sin importar mayusculas, minusculas o espacios."""

        indices = {
            "uq_usuarios_correo_normalizado_greenup",
            "uq_usuarios_usuario_normalizado_greenup",
            "uq_usuarios_documento_normalizado_greenup",
            "uq_recicladoras_nit_normalizado_greenup",
        }

        with self.conexion.cursor() as cursor:
            cursor.execute(
                """
                SELECT indexname
                FROM pg_indexes
                WHERE schemaname = 'public'
                  AND indexname = ANY(%s)
                """,
                (list(indices),),
            )
            existentes = {fila["indexname"] for fila in cursor.fetchall()}

        self.assertEqual(existentes, indices)

    def test_trigger_valida_usuario_y_documento(self):
        """Confirma que Supabase bloquee usuario corto y documento duplicado."""

        with self.conexion.cursor() as cursor:
            cursor.execute(
                """
                SELECT trigger_name
                FROM information_schema.triggers
                WHERE event_object_schema = 'public'
                  AND event_object_table = 'usuarios'
                  AND trigger_name = 'trg_greenup_validar_usuario_unico'
                """
            )
            triggers = cursor.fetchall()

        self.assertGreaterEqual(len(triggers), 1)

    def test_no_hay_duplicados_en_datos_reales_de_usuarios(self):
        """Revisa que los datos actuales no tengan cedulas, usuarios o correos repetidos."""

        consultas = {
            "documentos": """
                SELECT LOWER(REGEXP_REPLACE(TRIM(numero_documento), '[^0-9A-Za-z]', '', 'g')) AS clave
                FROM usuarios
                WHERE numero_documento IS NOT NULL
                  AND TRIM(numero_documento) <> ''
                GROUP BY 1
                HAVING COUNT(*) > 1
            """,
            "correos": """
                SELECT LOWER(TRIM(correo)) AS clave
                FROM usuarios
                WHERE correo IS NOT NULL
                  AND TRIM(correo) <> ''
                GROUP BY 1
                HAVING COUNT(*) > 1
            """,
            "usuarios": """
                SELECT LOWER(TRIM(usuario)) AS clave
                FROM usuarios
                WHERE usuario IS NOT NULL
                  AND TRIM(usuario) <> ''
                GROUP BY 1
                HAVING COUNT(*) > 1
            """,
        }

        with self.conexion.cursor() as cursor:
            for nombre, sql in consultas.items():
                with self.subTest(nombre=nombre):
                    cursor.execute(sql)
                    self.assertEqual(cursor.fetchall(), [])

    def test_no_hay_reciclajes_huerfanos(self):
        """Comprueba que cada reciclaje tenga usuario, material y punto existente."""

        with self.conexion.cursor() as cursor:
            cursor.execute(
                """
                SELECT COUNT(*) AS total
                FROM registrar_reciclaje reciclaje
                LEFT JOIN usuarios usuario
                  ON usuario.id_usuario = reciclaje.id_usuario
                LEFT JOIN tipo_material material
                  ON material.id_tipo_material = reciclaje.id_tipo_material
                LEFT JOIN puntos_reciclaje punto
                  ON punto.id_punto = reciclaje.id_punto
                WHERE usuario.id_usuario IS NULL
                   OR material.id_tipo_material IS NULL
                   OR punto.id_punto IS NULL
                """
            )
            resultado = cursor.fetchone()

        self.assertEqual(resultado["total"], 0)

    def test_registro_ciudadano_rechaza_cuerpo_vacio(self):
        """Evita errores internos cuando el registro llega sin datos."""

        respuesta = self.cliente.post("/api/usuarios/registro", json={})

        self.assertEqual(respuesta.status_code, 400)
        self.assertIn("nombres", respuesta.get_json()["mensaje"].lower())

    def test_registro_ciudadano_rechaza_usuario_menor_a_cinco(self):
        """El registro publico no acepta nombres de usuario demasiado cortos."""

        respuesta = self.cliente.post(
            "/api/usuarios/registro",
            json={
                "nombres": "Prueba",
                "apellidos": "Usuario",
                "correo": "usuario_corto_greenup@example.com",
                "usuario": "abc",
                "contrasena": "GreenUp2026!",
                "numero_documento": "900001234",
                "celular": "3000000000",
                "id_tipo_documento": 1,
                "genero": "Otro",
            },
        )

        self.assertEqual(respuesta.status_code, 400)
        self.assertIn("minimo 5", respuesta.get_json()["mensaje"].lower())

    def test_registro_ciudadano_rechaza_documento_duplicado(self):
        """No permite crear otro ciudadano con una cedula ya registrada."""

        with self.conexion.cursor() as cursor:
            cursor.execute(
                """
                SELECT numero_documento
                FROM usuarios
                WHERE numero_documento IS NOT NULL
                  AND TRIM(numero_documento) <> ''
                LIMIT 1
                """
            )
            usuario_existente = cursor.fetchone()

        if not usuario_existente:
            self.skipTest("No hay usuarios existentes para validar cedula duplicada.")

        respuesta = self.cliente.post(
            "/api/usuarios/registro",
            json={
                "nombres": "Prueba",
                "apellidos": "Duplicada",
                "correo": "documento_duplicado_greenup@example.com",
                "usuario": "duplicado_greenup",
                "contrasena": "GreenUp2026!",
                "numero_documento": usuario_existente["numero_documento"],
                "celular": "3000000000",
                "id_tipo_documento": 1,
                "genero": "Otro",
            },
        )

        self.assertEqual(respuesta.status_code, 400)
        self.assertIn("documento", respuesta.get_json()["mensaje"].lower())

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

    def test_relaciones_criticas_de_supabase_existen(self):
        """Confirma llaves foraneas agregadas para juego, recuperacion y progreso."""

        restricciones = {
            "fk_ciudadano_puntos_juego_usuario_greenup",
            "fk_noticia_cuestionarios_noticia_greenup",
            "fk_noticia_juego_intentos_usuario_greenup",
            "fk_noticia_juego_intentos_noticia_greenup",
            "fk_codigos_recuperacion_usuario_greenup",
            "fk_progreso_contenido_usuario_greenup",
            "fk_progreso_contenido_contenido_greenup",
            "fk_usuario_desafio_usuario_greenup",
            "fk_usuario_desafio_desafio_greenup",
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

    def test_servicio_reportes_rechaza_filtros_invalidos(self):
        """Revisa validacion backend de fechas e IDs antes de consultar reportes."""

        from app.services.reportes_service import servicio_reporte_reciclaje

        respuesta, estado = servicio_reporte_reciclaje({"fecha_inicio": "21-08-2026"})
        self.assertEqual(estado, 400)
        self.assertIn("fecha inicial", respuesta["mensaje"].lower())

        respuesta, estado = servicio_reporte_reciclaje({"id_usuario": "-1"})
        self.assertEqual(estado, 400)
        self.assertIn("id_usuario", respuesta["mensaje"])

    def test_storage_greenup_configurado(self):
        """Verifica buckets y limites basicos de Supabase Storage."""

        with self.conexion.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, public, file_size_limit, allowed_mime_types
                FROM storage.buckets
                WHERE id IN ('greenup-perfiles', 'greenup-documentos-recicladoras')
                ORDER BY id
                """
            )
            buckets = {fila["id"]: fila for fila in cursor.fetchall()}

        self.assertEqual(set(buckets), {"greenup-perfiles", "greenup-documentos-recicladoras"})
        self.assertTrue(buckets["greenup-perfiles"]["public"])
        self.assertFalse(buckets["greenup-documentos-recicladoras"]["public"])
        self.assertLessEqual(buckets["greenup-perfiles"]["file_size_limit"], 2097152)
        self.assertLessEqual(buckets["greenup-documentos-recicladoras"]["file_size_limit"], 10485760)


if __name__ == "__main__":
    unittest.main(verbosity=2)
