# Rutas de contenido educativo

from flask import Blueprint, request, jsonify

from app.services.contenido_service import (
    servicio_crear_contenido,
    servicio_listar_contenidos
)


contenido_bp = Blueprint("contenido", __name__)


@contenido_bp.route("/contenido", methods=["POST"])
def ruta_crear_contenido():
    data = request.get_json()
    respuesta, estado = servicio_crear_contenido(data)
    return jsonify(respuesta), estado


@contenido_bp.route("/contenido", methods=["GET"])
def ruta_listar_contenidos():
    respuesta, estado = servicio_listar_contenidos()
    return jsonify(respuesta), estado