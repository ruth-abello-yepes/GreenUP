## Archivo: estadisticas_routes.py
## Controlador HTTP: recibe peticiones, valida datos basicos y delega en servicios.

from flask import Blueprint, g, jsonify

from app.middlewares.auth_middleware import login_requerido
from app.middlewares.roles_middleware import rol_requerido
from app.services.estadisticas_service import EstadisticasService


estadisticas_bp = Blueprint("estadisticas", __name__)


@estadisticas_bp.route("/api/public/inicio", methods=["GET"])
def obtener_metricas_inicio_publico():
    """Devuelve indicadores reales para la portada publica."""
    try:
        return jsonify(EstadisticasService.metricas_inicio_publico()), 200
    except Exception:
        return jsonify({"mensaje": "No fue posible cargar los indicadores publicos"}), 500


@estadisticas_bp.route("/api/estadisticas/ciudadano/inicio", methods=["GET"])
@login_requerido
@rol_requerido([3])
def obtener_inicio_ciudadano():
    """Devuelve los indicadores reales de la pagina inicial del ciudadano."""
    try:
        return jsonify(EstadisticasService.inicio_ciudadano(g.id_usuario)), 200
    except Exception as error:
        return jsonify({"mensaje": "No fue posible cargar el inicio", "error": str(error)}), 500


@estadisticas_bp.route("/api/estadisticas/ciudadano", methods=["GET"])
@login_requerido
@rol_requerido([3])
def obtener_resumen_ciudadano():
    """Devuelve las estadisticas del ciudadano autenticado."""
    try:
        return jsonify(EstadisticasService.resumen_ciudadano(g.id_usuario)), 200
    except Exception as error:
        return jsonify({"mensaje": "No fue posible cargar las estadisticas", "error": str(error)}), 500


@estadisticas_bp.route("/estadisticas", methods=["GET"])
@login_requerido
@rol_requerido([1])
def obtener_resumen_admin():
    """
    Ruta para el administrador del sistema.

    La consume la pagina admin_estadisticas.html para mostrar los numeros
    generales del sistema sin tocar las pantallas de ciudadano ni recicladora.
    """
    try:
        return jsonify(EstadisticasService.resumen_admin()), 200
    except Exception:
        return jsonify({"mensaje": "No fue posible cargar las estadisticas administrativas"}), 500


@estadisticas_bp.route("/api/estadisticas/semana_actual", methods=["GET"])
@login_requerido
def obtener_semana_actual():
    """
    Ruta que ya existia para graficas semanales.

    Se conserva para no romper otras partes del proyecto y usa la sesion actual.
    """
    try:
        datos_grafica = EstadisticasService.formatear_datos_semanales(g.id_usuario)
        return jsonify(datos_grafica), 200
    except Exception:
        return jsonify({"mensaje": "No fue posible cargar la semana actual"}), 500
