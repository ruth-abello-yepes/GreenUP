## Archivo: notificaciones_routes.py
## Controlador HTTP: recibe peticiones, valida datos basicos y delega en servicios.

from flask import Blueprint, g, jsonify, request

from app.middlewares.auth_middleware import login_requerido
from app.middlewares.roles_middleware import rol_requerido
from app.services.notificaciones_service import (
    servicio_crear_notificacion,
    servicio_listar_notificaciones,
    servicio_marcar_notificacion_leida,
)


notificaciones_bp = Blueprint("notificaciones", __name__, url_prefix="/api/notificaciones")


@notificaciones_bp.route("", methods=["GET"])
@login_requerido
def ruta_listar_notificaciones():
    respuesta, estado = servicio_listar_notificaciones(g.id_usuario, g.id_rol)
    return jsonify(respuesta), estado


@notificaciones_bp.route("", methods=["POST"])
@login_requerido
@rol_requerido([1])
def ruta_crear_notificacion():
    datos = request.get_json() or {}
    respuesta, estado = servicio_crear_notificacion(datos)
    return jsonify(respuesta), estado


@notificaciones_bp.route("/<int:id_notificacion>/leida", methods=["PUT"])
@login_requerido
def ruta_marcar_notificacion_leida(id_notificacion):
    respuesta, estado = servicio_marcar_notificacion_leida(id_notificacion, g.id_usuario, g.id_rol)
    return jsonify(respuesta), estado
