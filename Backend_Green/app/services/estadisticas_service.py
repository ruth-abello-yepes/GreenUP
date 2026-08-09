## Archivo: estadisticas_service.py
## Servicio de negocio: valida reglas del sistema antes de llamar a modelos.

from app.models.estadisticas_model import EstadisticasModel


class EstadisticasService:
    @staticmethod
    def formatear_datos_semanales(usuario_id):
        """
        Convierte la respuesta de Supabase en una lista lista para graficas.

        PostgreSQL devuelve el dia asi:
        0 = domingo, 1 = lunes, 2 = martes, 3 = miercoles,
        4 = jueves, 5 = viernes, 6 = sabado.
        """
        resultados_bd = EstadisticasModel.obtener_actividad_semanal(usuario_id)

        datos_semana = {
            "LUN": 0.0,
            "MAR": 0.0,
            "MIE": 0.0,
            "JUE": 0.0,
            "VIE": 0.0,
            "SAB": 0.0,
            "DOM": 0.0,
        }

        mapa_postgres = {
            1: "LUN",
            2: "MAR",
            3: "MIE",
            4: "JUE",
            5: "VIE",
            6: "SAB",
            0: "DOM",
        }

        for fila in resultados_bd:
            dia_texto = mapa_postgres.get(fila["dia_numero"])
            if dia_texto:
                datos_semana[dia_texto] = float(fila["total_kg"])

        return [{"dia": dia, "kg": kg} for dia, kg in datos_semana.items()]

    @staticmethod
    def resumen_admin():
        """
        Prepara las estadisticas generales que consulta el administrador.
        """
        resumen = EstadisticasModel.obtener_resumen_admin()
        return {
            "total_reciclajes": resumen["total_reciclajes"] if resumen else 0,
            "total_cantidad": resumen["total_cantidad"] if resumen else 0,
        }
