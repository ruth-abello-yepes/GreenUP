## Archivo: estadisticas_service.py
## Servicio de negocio: valida reglas del sistema antes de llamar a modelos.

from app.models.estadisticas_model import EstadisticasModel


class EstadisticasService:
    @staticmethod
    def inicio_ciudadano(usuario_id):
        """Une los indicadores que necesita la pagina inicial del ciudadano."""
        resumen = EstadisticasService.resumen_ciudadano(usuario_id)
        complementos = EstadisticasModel.obtener_complementos_inicio_ciudadano(usuario_id)
        usuario_ranking = next(
            (fila for fila in resumen["ranking"] if fila["es_usuario_actual"]),
            None,
        )

        return {
            "total_puntos": resumen["total_puntos"],
            "puntos_mes": resumen["puntos_mes"],
            "total_kg": resumen["total_kg"],
            "kg_mes": resumen["kg_mes"],
            "total_entregas": resumen["total_entregas"],
            "ultima_entrega": resumen["ultima_entrega"],
            "posicion_ranking": usuario_ranking["posicion"] if usuario_ranking else None,
            **complementos,
        }

    @staticmethod
    def resumen_ciudadano(usuario_id):
        """Prepara las estadisticas personales para el dashboard ciudadano."""
        datos = EstadisticasModel.obtener_estadisticas_ciudadano(usuario_id)
        ultima_entrega = datos.get("ultima_entrega")

        return {
            "total_puntos": datos.get("total_puntos", 0),
            "total_kg": datos.get("total_kg", 0),
            "total_entregas": datos.get("total_entregas", 0),
            "puntos_mes": datos.get("puntos_mes", 0),
            "kg_mes": datos.get("kg_mes", 0),
            "ultima_entrega": ultima_entrega.isoformat() if ultima_entrega else None,
            "desglose_materiales": datos.get("desglose_materiales", []),
            "evolucion_mensual": datos.get("evolucion_mensual", []),
            "ranking": [
                {
                    **fila,
                    "es_usuario_actual": fila.get("id_usuario") == usuario_id,
                }
                for fila in datos.get("ranking", [])
            ],
        }

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
            "total_reciclajes": resumen.get("total_reciclajes", 0) if resumen else 0,
            "total_cantidad": resumen.get("total_cantidad", 0) if resumen else 0,
            "total_usuarios": resumen.get("total_usuarios", 0) if resumen else 0,
            "total_puntos": resumen.get("total_puntos", 0) if resumen else 0,
            "reciclaje_por_residuo": resumen.get("reciclaje_por_residuo", []) if resumen else [],
            "reciclaje_por_material": resumen.get("reciclaje_por_material", []) if resumen else [],
            "ranking_usuarios": resumen.get("ranking_usuarios", []) if resumen else [],
            "evolucion_mensual": resumen.get("evolucion_mensual", []) if resumen else [],
        }
