from flask import Blueprint, request, jsonify
from app.services.usuarios_service import servicio_registrar_usuario, servicio_listar_usuarios, servicio_buscar_usuario, servicio_actualizar_usuario, servicio_inhabilitar_usuario


usuarios_bp = Blueprint("usuarios", __name__, url_prefix="/api/usuarios")


@usuarios_bp.route("/registrar", methods=["POST"])
def ruta_registrar_usuario():
    datos = request.get_json()

    respuesta, estado = servicio_registrar_usuario(datos)

    return jsonify(respuesta), estado


@usuarios_bp.route("/listar", methods=["GET"])
def ruta_listar_usuarios():
    respuesta, estado = servicio_listar_usuarios()

    return jsonify(respuesta), estado


@usuarios_bp.route("/buscar/<int:id_usuario>", methods=["GET"])
def ruta_buscar_usuario(id_usuario):
    respuesta, estado = servicio_buscar_usuario(id_usuario)

    return jsonify(respuesta), estado


@usuarios_bp.route("/actualizar/<int:id_usuario>", methods=["PUT"])
def ruta_actualizar_usuario(id_usuario):
    datos = request.get_json()

    respuesta, estado = servicio_actualizar_usuario(id_usuario, datos)

    return jsonify(respuesta), estado


@usuarios_bp.route("/inhabilitar/<int:id_usuario>", methods=["DELETE"])
def ruta_inhabilitar_usuario(id_usuario):
    respuesta, estado = servicio_inhabilitar_usuario(id_usuario)

    return jsonify(respuesta), estado
