from flask import Blueprint, request, jsonify
from app.services.roles_service import servicio_registrar_rol, servicio_listar_roles, servicio_buscar_rol, servicio_actualizar_rol, servicio_inhabilitar_rol


roles_bp = Blueprint("roles", __name__, url_prefix="/api/roles")


@roles_bp.route("/registrar", methods=["POST"])
def ruta_registrar_rol():
    datos = request.get_json()

    respuesta, estado = servicio_registrar_rol(datos)

    return jsonify(respuesta), estado


@roles_bp.route("/listar", methods=["GET"])
def ruta_listar_roles():
    respuesta, estado = servicio_listar_roles()

    return jsonify(respuesta), estado


@roles_bp.route("/buscar/<int:id_rol>", methods=["GET"])
def ruta_buscar_rol(id_rol):
    respuesta, estado = servicio_buscar_rol(id_rol)

    return jsonify(respuesta), estado


@roles_bp.route("/actualizar/<int:id_rol>", methods=["PUT"])
def ruta_actualizar_rol(id_rol):
    datos = request.get_json()

    respuesta, estado = servicio_actualizar_rol(id_rol, datos)

    return jsonify(respuesta), estado


@roles_bp.route("/inhabilitar/<int:id_rol>", methods=["DELETE"])
def ruta_inhabilitar_rol(id_rol):
    respuesta, estado = servicio_inhabilitar_rol(id_rol)

    return jsonify(respuesta), estado
