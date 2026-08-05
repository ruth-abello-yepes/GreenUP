from app.models.estadisticas_model import EstadisticasModel

class EstadisticasService:
    @staticmethod
    def formatear_datos_semanales(usuario_id):
        # 1. Traemos los datos crudos de MySQL
        resultados_bd = EstadisticasModel.obtener_actividad_semanal(usuario_id)
        
        # 2. Diccionario base (Todos los días empiezan en 0.0 kg)
        datos_semana = {
            'LUN': 0.0, 'MAR': 0.0, 'MIE': 0.0, 'JUE': 0.0, 
            'VIE': 0.0, 'SAB': 0.0, 'DOM': 0.0
        }

        # 3. Mapeamos la respuesta de MySQL (DAYOFWEEK: 1=Domingo, 2=Lunes...)
        mapa_mysql = {2: 'LUN', 3: 'MAR', 4: 'MIE', 5: 'JUE', 6: 'VIE', 7: 'SAB', 1: 'DOM'}

        # 4. Sobrescribimos los días donde sí hubo reciclaje
        for fila in resultados_bd:
            dia_texto = mapa_mysql.get(fila['dia_numero'])
            if dia_texto:
                datos_semana[dia_texto] = float(fila['total_kg'])

        # 5. Lo convertimos al formato exacto de lista que espera nuestro JavaScript
        resultado_final = []
        for dia, kg in datos_semana.items():
            resultado_final.append({'dia': dia, 'kg': kg})
            
        return resultado_final