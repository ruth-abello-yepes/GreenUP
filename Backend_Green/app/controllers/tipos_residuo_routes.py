## Archivo: tipos_residuo_routes.py
## Controlador HTTP: recibe peticiones, valida datos basicos y delega en servicios.

# Rutas de tipos de residuo
# Aquí se crean las URL del módulo.

from flask import Blueprint, request, jsonify
from app.middlewares.auth_middleware import login_requerido
from app.middlewares.roles_middleware import rol_requerido
from app.services.tipos_residuo_service import (
    servicio_crear_tipo_residuo,
    servicio_listar_tipos_residuo,
    servicio_buscar_tipo_residuo,
    servicio_editar_tipo_residuo,
    servicio_cambiar_estado_tipo_residuo
)


tipos_residuo_bp = Blueprint("tipos_residuo", __name__)


@tipos_residuo_bp.route("/tipos-residuo", methods=["POST"])
@login_requerido
@rol_requerido([1])
def ruta_crear_tipo_residuo():
    """Ruta para crear un tipo de residuo."""

    data = request.get_json()
    respuesta, estado = servicio_crear_tipo_residuo(data)

    return jsonify(respuesta), estado


@tipos_residuo_bp.route("/tipos-residuo", methods=["GET"])
def ruta_listar_tipos_residuo():
    """Ruta para listar tipos de residuo."""

    respuesta, estado = servicio_listar_tipos_residuo()

    return jsonify(respuesta), estado


@tipos_residuo_bp.route("/tipos-residuo/<int:id_tipo_residuo>", methods=["GET"])
def ruta_buscar_tipo_residuo(id_tipo_residuo):
    """Ruta para buscar un tipo de residuo."""

    respuesta, estado = servicio_buscar_tipo_residuo(id_tipo_residuo)

    return jsonify(respuesta), estado


@tipos_residuo_bp.route("/tipos-residuo/<int:id_tipo_residuo>", methods=["PUT"])
@login_requerido
@rol_requerido([1])
def ruta_editar_tipo_residuo(id_tipo_residuo):
    """Ruta para editar un tipo de residuo."""

    data = request.get_json()
    respuesta, estado = servicio_editar_tipo_residuo(id_tipo_residuo, data)

    return jsonify(respuesta), estado


@tipos_residuo_bp.route("/tipos-residuo/<int:id_tipo_residuo>/estado", methods=["PUT"])
@login_requerido
@rol_requerido([1])
def ruta_cambiar_estado_tipo_residuo(id_tipo_residuo):
    """Ruta para cambiar estado."""

    data = request.get_json()
    respuesta, estado = servicio_cambiar_estado_tipo_residuo(id_tipo_residuo, data)

    return jsonify(respuesta), estado
