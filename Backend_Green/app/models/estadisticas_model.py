## Archivo: estadisticas_model.py
## Modelo de datos: contiene consultas SQL y operaciones directas con la base de datos.

from app.common.database import obtener_conexion


class EstadisticasModel:
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
