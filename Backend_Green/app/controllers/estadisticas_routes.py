from flask import Blueprint, jsonify, request
from app.services.estadisticas_service import EstadisticasService

# Asumiendo que tienes un middleware para verificar el token del usuario
# from app.middlewares.auth_middleware import verificar_token 

estadisticas_bp = Blueprint('estadisticas', __name__)

@estadisticas_bp.route('/api/estadisticas/semana_actual', methods=['GET'])
# @verificar_token  <-- Descoméntalo cuando tu seguridad JWT esté lista
def obtener_semana_actual():
    try:
        # Aquí obtendrías el ID del usuario desencriptando el Token JWT.
        # Para hacer pruebas ahora, simularemos que es el usuario con ID = 1
        usuario_id = 1 
        
        # Pedimos al servicio los datos ya formateados
        datos_grafica = EstadisticasService.formatear_datos_semanales(usuario_id)
        
        # Flask lo convierte a JSON y lo envía al Frontend
        return jsonify(datos_grafica), 200
        
    except Exception as e:
        return jsonify({'error': 'Ocurrió un error al procesar las estadísticas'}), 500