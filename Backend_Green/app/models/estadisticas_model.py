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
        Devuelve los numeros principales para el administrador del sistema.

        Se usa en la pagina de estadisticas del admin para mostrar:
        - cantidad total de registros de reciclaje
        - cantidad total reciclada
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
            return cursor.fetchone()
        finally:
            cursor.close()
            conexion.close()
