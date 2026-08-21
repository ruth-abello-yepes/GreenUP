## Archivo: reciclaje_routes.py
## Controlador HTTP: recibe peticiones, valida datos basicos y delega en servicios.

# Rutas de registrar reciclaje

from flask import Blueprint, g, request, jsonify

from app.middlewares.auth_middleware import login_requerido
from app.middlewares.roles_middleware import rol_requerido
from app.services.reciclaje_service import (
    servicio_catalogo_reciclaje,
    servicio_crear_reciclaje,
    servicio_listar_reciclajes,
    servicio_listar_reciclajes_ciudadano,
    servicio_buscar_reciclaje_autorizado,
    servicio_cambiar_estado_reciclaje
)


reciclaje_bp = Blueprint("reciclaje", __name__)


@reciclaje_bp.route("/reciclaje", methods=["POST"])
@login_requerido
@rol_requerido([3])
def ruta_crear_reciclaje():
    data = request.get_json() or {}
    respuesta, estado = servicio_crear_reciclaje(data, g.id_usuario)
    return jsonify(respuesta), estado


@reciclaje_bp.route("/reciclaje", methods=["GET"])
@login_requerido
@rol_requerido([1])
def ruta_listar_reciclajes():
    respuesta, estado = servicio_listar_reciclajes()
    return jsonify(respuesta), estado


@reciclaje_bp.route("/reciclaje/catalogo", methods=["GET"])
@login_requerido
@rol_requerido([3])
def ruta_catalogo_reciclaje():
    respuesta, estado = servicio_catalogo_reciclaje()
    return jsonify(respuesta), estado


@reciclaje_bp.route("/reciclaje/mis-registros", methods=["GET"])
@login_requerido
@rol_requerido([3])
def ruta_mis_reciclajes():
    respuesta, estado = servicio_listar_reciclajes_ciudadano(g.id_usuario)
    return jsonify(respuesta), estado


@reciclaje_bp.route("/reciclaje/<int:id_registro>", methods=["GET"])
@login_requerido
def ruta_buscar_reciclaje(id_registro):
    respuesta, estado = servicio_buscar_reciclaje_autorizado(id_registro, g.id_usuario, g.id_rol)
    return jsonify(respuesta), estado


@reciclaje_bp.route("/reciclaje/<int:id_registro>/estado", methods=["PUT"])
@login_requerido
@rol_requerido([1])
def ruta_cambiar_estado_reciclaje(id_registro):
    data = request.get_json() or {}
    data["id_recicladora_confirma"] = g.id_usuario
    respuesta, estado = servicio_cambiar_estado_reciclaje(id_registro, data)
    return jsonify(respuesta), estado
