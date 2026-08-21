## Archivo: faq_routes.py
## Controlador HTTP: recibe peticiones, valida datos basicos y delega en servicios.

# Rutas de preguntas frecuentes

from flask import Blueprint, request, jsonify

from app.middlewares.auth_middleware import login_requerido
from app.middlewares.roles_middleware import rol_requerido
from app.services.faq_service import (
    servicio_crear_pregunta,
    servicio_listar_preguntas
)


faq_bp = Blueprint("faq", __name__)


@faq_bp.route("/faq", methods=["POST"])
@login_requerido
@rol_requerido([1, 2])
def ruta_crear_pregunta():
    data = request.get_json()
    respuesta, estado = servicio_crear_pregunta(data)
    return jsonify(respuesta), estado


@faq_bp.route("/faq", methods=["GET"])
def ruta_listar_preguntas():
    respuesta, estado = servicio_listar_preguntas()
    return jsonify(respuesta), estado
