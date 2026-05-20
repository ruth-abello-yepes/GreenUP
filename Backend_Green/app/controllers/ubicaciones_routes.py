# Rutas de puntos de reciclaje

from flask import Blueprint, request, jsonify

from app.services.ubicaciones_service import (
    servicio_crear_ubicacion,
    servicio_listar_ubicaciones
)

ubicaciones_bp = Blueprint("ubicaciones", __name__)


@ubicaciones_bp.route("/ubicaciones", methods=["POST"])
def ruta_crear_ubicacion():

    data = request.get_json()

    respuesta, estado = servicio_crear_ubicacion(data)

    return jsonify(respuesta), estado


@ubicaciones_bp.route("/ubicaciones", methods=["GET"])
def ruta_listar_ubicaciones():

    respuesta, estado = servicio_listar_ubicaciones()

    return jsonify(respuesta), estado