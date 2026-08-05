from app.common.database import obtener_conexion

class EstadisticasModel:
    @staticmethod
    def obtener_actividad_semanal(usuario_id):
        conexion = obtener_conexion()
        # Usamos dictionary=True para que MySQL nos devuelva los datos con los nombres de las columnas
        cursor = conexion.cursor(dictionary=True) 
        
        try:
            # Consulta nativa para MySQL: Agrupa por día de la semana y suma los kilos de los últimos 7 días
            query = """
                SELECT 
                    DAYOFWEEK(fecha) as dia_numero,
                    SUM(peso_kg) as total_kg
                FROM registros_reciclaje
                WHERE usuario_id = %s 
                AND fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                GROUP BY dia_numero
            """
            cursor.execute(query, (usuario_id,))
            return cursor.fetchall()
        
        finally:
            cursor.close()
            conexion.close()