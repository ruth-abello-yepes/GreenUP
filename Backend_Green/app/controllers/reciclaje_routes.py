## Archivo: reciclaje_routes.py
## Controlador HTTP: recibe peticiones, valida datos basicos y delega en servicios.

# Rutas de registrar reciclaje

from flask import Blueprint, request, jsonify

from app.services.reciclaje_service import (
    servicio_crear_reciclaje,
    servicio_listar_reciclajes,
    servicio_buscar_reciclaje,
    servicio_cambiar_estado_reciclaje
)


reciclaje_bp = Blueprint("reciclaje", __name__)


@reciclaje_bp.route("/reciclaje", methods=["POST"])
def ruta_crear_reciclaje():
    data = request.get_json()
    respuesta, estado = servicio_crear_reciclaje(data)
    return jsonify(respuesta), estado


@reciclaje_bp.route("/reciclaje", methods=["GET"])
def ruta_listar_reciclajes():
    respuesta, estado = servicio_listar_reciclajes()
    return jsonify(respuesta), estado


@reciclaje_bp.route("/reciclaje/<int:id_registro>", methods=["GET"])
def ruta_buscar_reciclaje(id_registro):
    respuesta, estado = servicio_buscar_reciclaje(id_registro)
    return jsonify(respuesta), estado


@reciclaje_bp.route("/reciclaje/<int:id_registro>/estado", methods=["PUT"])
def ruta_cambiar_estado_reciclaje(id_registro):
    data = request.get_json()
    respuesta, estado = servicio_cambiar_estado_reciclaje(id_registro, data)
    return jsonify(respuesta), estado