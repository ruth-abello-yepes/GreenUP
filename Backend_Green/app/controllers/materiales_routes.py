## Archivo: materiales_routes.py
## Controlador HTTP: recibe peticiones, valida datos basicos y delega en servicios.

# Archivo: materiales_routes.py
# Rutas del modulo de materiales para el Administrador del Sistema.
#
# Estas rutas permiten:
# - Crear materiales reciclables.
# - Listar materiales.
# - Buscar un material.
# - Editar un material.
# - Cambiar su estado.

from flask import Blueprint, request, jsonify

from app.services.materiales_service import (
    servicio_crear_material,
    servicio_listar_materiales,
    servicio_buscar_material,
    servicio_editar_material,
    servicio_cambiar_estado
)


materiales_bp = Blueprint("materiales", __name__)


@materiales_bp.route("/materiales", methods=["POST"])
def ruta_crear_material():
    """Crea un material reciclable."""
    data = request.get_json()
    respuesta, estado = servicio_crear_material(data)
    return jsonify(respuesta), estado


@materiales_bp.route("/materiales", methods=["GET"])
def ruta_listar_materiales():
    """Lista todos los materiales reciclables."""
    respuesta, estado = servicio_listar_materiales()
    return jsonify(respuesta), estado


@materiales_bp.route("/materiales/<int:id_material>", methods=["GET"])
def ruta_buscar_material(id_material):
    """Busca un material por ID."""
    respuesta, estado = servicio_buscar_material(id_material)
    return jsonify(respuesta), estado


@materiales_bp.route("/materiales/<int:id_material>", methods=["PUT"])
def ruta_editar_material(id_material):
    """Edita un material existente."""
    data = request.get_json()
    respuesta, estado = servicio_editar_material(id_material, data)
    return jsonify(respuesta), estado


@materiales_bp.route("/materiales/<int:id_material>/estado", methods=["PUT"])
def ruta_cambiar_estado(id_material):
    """Activa o inactiva un material."""
    data = request.get_json()
    respuesta, estado = servicio_cambiar_estado(id_material, data)
    return jsonify(respuesta), estado
