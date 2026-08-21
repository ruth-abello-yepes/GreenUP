## Archivo: novedades_routes.py
## Controlador HTTP: recibe peticiones, valida datos basicos y delega en servicios.

# Rutas de novedades

from flask import Blueprint, g, request, jsonify

from app.middlewares.auth_middleware import login_requerido
from app.middlewares.roles_middleware import rol_requerido
from app.services.novedades_service import (
    servicio_crear_novedad,
    servicio_listar_novedades,
    servicio_buscar_novedad,
    servicio_cambiar_estado_novedad
)


novedades_bp = Blueprint("novedades", __name__)


@novedades_bp.route("/novedades", methods=["POST"])
@login_requerido
@rol_requerido([1, 2])
def ruta_crear_novedad():
    data = request.get_json()
    data["id_usuario"] = g.id_usuario
    respuesta, estado = servicio_crear_novedad(data)
    return jsonify(respuesta), estado


@novedades_bp.route("/novedades", methods=["GET"])
def ruta_listar_novedades():
    respuesta, estado = servicio_listar_novedades()
    return jsonify(respuesta), estado


@novedades_bp.route("/novedades/<int:id_novedad>", methods=["GET"])
def ruta_buscar_novedad(id_novedad):
    respuesta, estado = servicio_buscar_novedad(id_novedad)
    return jsonify(respuesta), estado


@novedades_bp.route("/novedades/<int:id_novedad>/estado", methods=["PUT"])
@login_requerido
@rol_requerido([1])
def ruta_cambiar_estado_novedad(id_novedad):
    data = request.get_json()
    respuesta, estado = servicio_cambiar_estado_novedad(id_novedad, data)
    return jsonify(respuesta), estado
