from flask import Blueprint, jsonify
from app.services.estadisticas_service import EstadisticasService


estadisticas_bp = Blueprint("estadisticas", __name__)


@estadisticas_bp.route("/estadisticas", methods=["GET"])
def obtener_resumen_admin():
    """
    Ruta para el administrador del sistema.

    La consume la pagina admin_estadisticas.html para mostrar los numeros
    generales del sistema sin tocar las pantallas de ciudadano ni recicladora.
    """
    try:
        return jsonify(EstadisticasService.resumen_admin()), 200
    except Exception as error:
        return jsonify({"error": str(error)}), 500


@estadisticas_bp.route("/api/estadisticas/semana_actual", methods=["GET"])
def obtener_semana_actual():
    """
    Ruta que ya existia para graficas semanales.

    Se conserva para no romper otras partes del proyecto. Si mas adelante usan
    token, aqui se puede reemplazar el usuario de prueba por el usuario logueado.
    """
    try:
        usuario_id = 1
        datos_grafica = EstadisticasService.formatear_datos_semanales(usuario_id)
        return jsonify(datos_grafica), 200
    except Exception as error:
        return jsonify({"error": str(error)}), 500
