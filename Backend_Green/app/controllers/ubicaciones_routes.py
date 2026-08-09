## Archivo: ubicaciones_routes.py
## Controlador HTTP: recibe peticiones, valida datos basicos y delega en servicios.

# Rutas de puntos de reciclaje

from flask import Blueprint, request, jsonify

from app.services.ubicaciones_service import (
    servicio_crear_ubicacion,
    servicio_listar_ubicaciones,
    servicio_cambiar_estado_ubicacion
)
from app.middlewares.auth_middleware import login_requerido
from app.middlewares.roles_middleware import rol_requerido

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


@ubicaciones_bp.route("/ubicaciones/<int:id_punto>/estado", methods=["PUT"])
@login_requerido
@rol_requerido([1])
def ruta_cambiar_estado_ubicacion(id_punto):
    """
    Activar o inactivar punto ecologico.

    Solo el administrador del sistema puede cambiar este estado.
    """

    data = request.get_json()

    respuesta, estado = servicio_cambiar_estado_ubicacion(id_punto, data)

    return jsonify(respuesta), estado
