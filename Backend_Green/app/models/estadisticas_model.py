## Archivo: estadisticas_model.py
## Modelo de datos: contiene consultas SQL y operaciones directas con la base de datos.

from app.common.database import obtener_conexion


class EstadisticasModel:
    @staticmethod
    def obtener_complementos_inicio_ciudadano(usuario_id):
        """Consulta actividad reciente y contenido real para el inicio ciudadano."""
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        try:
            cursor.execute(
                """
                SELECT
                    CASE EXTRACT(DOW FROM fecha_dia::date)
                        WHEN 0 THEN 'DOM'
                        WHEN 1 THEN 'LUN'
                        WHEN 2 THEN 'MAR'
                        WHEN 3 THEN 'MIE'
                        WHEN 4 THEN 'JUE'
                        WHEN 5 THEN 'VIE'
                        WHEN 6 THEN 'SAB'
                    END AS dia,
                    COALESCE(SUM(registrar_reciclaje.cantidad), 0)::float AS kg
                FROM GENERATE_SERIES(
                    CURRENT_DATE - INTERVAL '6 days',
                    CURRENT_DATE,
                    INTERVAL '1 day'
                ) AS dias(fecha_dia)
                LEFT JOIN registrar_reciclaje
                    ON registrar_reciclaje.fecha_hora::date = fecha_dia::date
                   AND registrar_reciclaje.id_usuario = %s
                   AND registrar_reciclaje.id_estado = 1
                GROUP BY fecha_dia
                ORDER BY fecha_dia
                """,
                (usuario_id,),
            )
            actividad_semanal = cursor.fetchall()

            cursor.execute(
                """
                SELECT COUNT(*)::int AS total
                FROM puntos_reciclaje
                WHERE id_estado = 1
                """
            )
            puntos_ecologicos = cursor.fetchone() or {}

            cursor.execute(
                """
                SELECT COUNT(*)::int AS total
                FROM contenido_educativo
                WHERE id_estado = 1
                """
            )
            contenidos = cursor.fetchone() or {}

            cursor.execute(
                """
                SELECT id_contenido, titulo, descripcion, tipo, url_recurso, imagen
                FROM contenido_educativo
                WHERE id_estado = 1
                ORDER BY fecha_publicacion DESC, id_contenido DESC
                LIMIT 1
                """
            )
            contenido_destacado = cursor.fetchone()

            cursor.execute(
                """
                SELECT COUNT(*)::int AS total
                FROM usuarios
                WHERE id_rol = 3
                  AND id_estado = 1
                """
            )
            ciudadanos = cursor.fetchone() or {}

            cursor.execute(
                """
                SELECT COUNT(*)::int AS total
                FROM notificaciones
                WHERE id_estado = 1
                  AND COALESCE(leida, false) = false
                  AND (id_usuario = %s OR id_rol = 3)
                """,
                (usuario_id,),
            )
            notificaciones = cursor.fetchone() or {}

            return {
                "actividad_semanal": actividad_semanal,
                "total_puntos_ecologicos": puntos_ecologicos.get("total", 0),
                "total_contenidos": contenidos.get("total", 0),
                "contenido_destacado": contenido_destacado,
                "total_ciudadanos": ciudadanos.get("total", 0),
                "notificaciones_no_leidas": notificaciones.get("total", 0),
            }
        finally:
            cursor.close()
            conexion.close()

    @staticmethod
    def obtener_estadisticas_ciudadano(usuario_id):
        """Consulta el impacto y el ranking del ciudadano autenticado."""
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        try:
            cursor.execute(
                """
                SELECT
                    COALESCE(SUM(puntos_obtenidos), 0)::int AS total_puntos,
                    COALESCE(SUM(cantidad), 0)::float AS total_kg,
                    COUNT(*)::int AS total_entregas,
                    COALESCE(SUM(puntos_obtenidos) FILTER (
                        WHERE fecha_hora >= DATE_TRUNC('month', CURRENT_DATE)
                    ), 0)::int AS puntos_mes,
                    COALESCE(SUM(cantidad) FILTER (
                        WHERE fecha_hora >= DATE_TRUNC('month', CURRENT_DATE)
                    ), 0)::float AS kg_mes,
                    MAX(fecha_hora) AS ultima_entrega
                FROM registrar_reciclaje
                WHERE id_usuario = %s
                  AND id_estado = 1
                """,
                (usuario_id,),
            )
            resumen = cursor.fetchone() or {}

            cursor.execute(
                """
                SELECT
                    COALESCE(tipo_material.nombre, 'Sin clasificar') AS material,
                    COALESCE(SUM(registrar_reciclaje.cantidad), 0)::float AS cantidad
                FROM registrar_reciclaje
                LEFT JOIN tipo_material
                    ON registrar_reciclaje.id_tipo_material = tipo_material.id_tipo_material
                WHERE registrar_reciclaje.id_usuario = %s
                  AND registrar_reciclaje.id_estado = 1
                GROUP BY tipo_material.nombre
                ORDER BY cantidad DESC, material
                """,
                (usuario_id,),
            )
            materiales = cursor.fetchall()

            cursor.execute(
                """
                SELECT
                    TO_CHAR(mes, 'YYYY-MM') AS mes,
                    COALESCE(SUM(registrar_reciclaje.puntos_obtenidos), 0)::int AS puntos
                FROM GENERATE_SERIES(
                    DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months',
                    DATE_TRUNC('month', CURRENT_DATE),
                    INTERVAL '1 month'
                ) AS mes
                LEFT JOIN registrar_reciclaje
                    ON DATE_TRUNC('month', registrar_reciclaje.fecha_hora) = mes
                   AND registrar_reciclaje.id_usuario = %s
                   AND registrar_reciclaje.id_estado = 1
                GROUP BY mes
                ORDER BY mes
                """,
                (usuario_id,),
            )
            evolucion_mensual = cursor.fetchall()

            cursor.execute(
                """
                WITH totales AS (
                    SELECT
                        usuarios.id_usuario,
                        CONCAT_WS(
                            ' ',
                            NULLIF(TRIM(usuarios.nombres), ''),
                            NULLIF(TRIM(usuarios.apellidos), '')
                        ) AS nombre,
                        usuarios.foto_perfil,
                        COALESCE(SUM(registrar_reciclaje.puntos_obtenidos), 0)::int AS total_puntos,
                        COALESCE(SUM(registrar_reciclaje.cantidad), 0)::float AS total_kg
                    FROM usuarios
                    LEFT JOIN registrar_reciclaje
                        ON registrar_reciclaje.id_usuario = usuarios.id_usuario
                       AND registrar_reciclaje.id_estado = 1
                    WHERE usuarios.id_rol = 3
                      AND usuarios.id_estado = 1
                    GROUP BY usuarios.id_usuario, usuarios.nombres, usuarios.apellidos,
                             usuarios.foto_perfil
                ), ranking AS (
                    SELECT
                        *,
                        ROW_NUMBER() OVER (
                            ORDER BY total_puntos DESC, total_kg DESC, id_usuario
                        )::int AS posicion
                    FROM totales
                )
                SELECT id_usuario, nombre, foto_perfil, total_puntos, posicion
                FROM ranking
                WHERE posicion <= 5 OR id_usuario = %s
                ORDER BY posicion
                """,
                (usuario_id,),
            )
            ranking = cursor.fetchall()

            return {
                "total_puntos": resumen.get("total_puntos", 0),
                "total_kg": resumen.get("total_kg", 0),
                "total_entregas": resumen.get("total_entregas", 0),
                "puntos_mes": resumen.get("puntos_mes", 0),
                "kg_mes": resumen.get("kg_mes", 0),
                "ultima_entrega": resumen.get("ultima_entrega"),
                "desglose_materiales": materiales,
                "evolucion_mensual": evolucion_mensual,
                "ranking": ranking,
            }
        finally:
            cursor.close()
            conexion.close()

    @staticmethod
    def obtener_actividad_semanal(usuario_id):
        """
        Consulta la actividad de reciclaje de un usuario durante los ultimos 7 dias.

        Este proyecto esta conectado a Supabase, que usa PostgreSQL. Por eso se usa
        EXTRACT(DOW FROM fecha_hora) en lugar de funciones propias de MySQL.
        """
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        try:
            query = """
                SELECT
                    EXTRACT(DOW FROM fecha_hora)::int AS dia_numero,
                    COALESCE(SUM(cantidad), 0) AS total_kg
                FROM registrar_reciclaje
                WHERE id_usuario = %s
                AND fecha_hora >= NOW() - INTERVAL '7 days'
                GROUP BY dia_numero
            """
            cursor.execute(query, (usuario_id,))
            return cursor.fetchall()
        finally:
            cursor.close()
            conexion.close()

    @staticmethod
    def obtener_resumen_admin():
        """
        Devuelve un resumen completo para el administrador del sistema.
        """
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        try:
            cursor.execute(
                """
                SELECT
                    COUNT(*)::int AS total_reciclajes,
                    COALESCE(SUM(cantidad), 0)::float AS total_cantidad
                FROM registrar_reciclaje
                """
            )
            resumen = cursor.fetchone() or {}

            cursor.execute(
                """
                SELECT COUNT(*)::int AS total_usuarios
                FROM usuarios
                """
            )
            usuarios = cursor.fetchone() or {}

            cursor.execute(
                """
                SELECT COUNT(*)::int AS total_puntos
                FROM puntos_reciclaje
                """
            )
            puntos = cursor.fetchone() or {}

            cursor.execute(
                """
                SELECT
                    COALESCE(tipo_residuo.nombre, 'Sin clasificar') AS nombre,
                    COALESCE(SUM(registrar_reciclaje.cantidad), 0)::float AS total
                FROM registrar_reciclaje
                LEFT JOIN tipo_material
                    ON registrar_reciclaje.id_tipo_material = tipo_material.id_tipo_material
                LEFT JOIN tipo_residuo
                    ON tipo_material.id_tipo_residuo = tipo_residuo.id_tipo_residuo
                GROUP BY tipo_residuo.nombre
                ORDER BY total DESC
                """
            )
            reciclaje_por_residuo = cursor.fetchall()

            cursor.execute(
                """
                SELECT
                    COALESCE(tipo_material.nombre, 'Sin material') AS nombre,
                    COALESCE(SUM(registrar_reciclaje.cantidad), 0)::float AS total
                FROM registrar_reciclaje
                LEFT JOIN tipo_material
                    ON registrar_reciclaje.id_tipo_material = tipo_material.id_tipo_material
                GROUP BY tipo_material.nombre
                ORDER BY total DESC
                LIMIT 8
                """
            )
            reciclaje_por_material = cursor.fetchall()

            cursor.execute(
                """
                SELECT
                    usuarios.id_usuario,
                    CONCAT(usuarios.nombres, ' ', usuarios.apellidos) AS nombre,
                    COALESCE(SUM(registrar_reciclaje.cantidad), 0)::float AS total
                FROM registrar_reciclaje
                LEFT JOIN usuarios
                    ON registrar_reciclaje.id_usuario = usuarios.id_usuario
                GROUP BY usuarios.id_usuario, usuarios.nombres, usuarios.apellidos
                ORDER BY total DESC
                LIMIT 10
                """
            )
            ranking_usuarios = cursor.fetchall()

            cursor.execute(
                """
                SELECT
                    TO_CHAR(DATE_TRUNC('month', fecha_hora), 'YYYY-MM') AS mes,
                    COALESCE(SUM(cantidad), 0)::float AS total
                FROM registrar_reciclaje
                GROUP BY DATE_TRUNC('month', fecha_hora)
                ORDER BY mes
                LIMIT 12
                """
            )
            evolucion_mensual = cursor.fetchall()

            return {
                "total_reciclajes": resumen.get("total_reciclajes", 0),
                "total_cantidad": resumen.get("total_cantidad", 0),
                "total_usuarios": usuarios.get("total_usuarios", 0),
                "total_puntos": puntos.get("total_puntos", 0),
                "reciclaje_por_residuo": reciclaje_por_residuo,
                "reciclaje_por_material": reciclaje_por_material,
                "ranking_usuarios": ranking_usuarios,
                "evolucion_mensual": evolucion_mensual,
            }
        finally:
            cursor.close()
            conexion.close()
