from flask import Blueprint, request, jsonify
from app.services.tipo_documento_service import servicio_registrar_tipo_documento, servicio_listar_tipos_documento, servicio_buscar_tipo_documento, servicio_actualizar_tipo_documento, servicio_inhabilitar_tipo_documento


tipo_documento_bp = Blueprint("tipo_documento", __name__, url_prefix="/api/tipo-documento")


@tipo_documento_bp.route("/registrar", methods=["POST"])
def ruta_registrar_tipo_documento():
    datos = request.get_json()

    respuesta, estado = servicio_registrar_tipo_documento(datos)

    return jsonify(respuesta), estado


@tipo_documento_bp.route("/listar", methods=["GET"])
def ruta_listar_tipos_documento():
    respuesta, estado = servicio_listar_tipos_documento()

    return jsonify(respuesta), estado


@tipo_documento_bp.route("/buscar/<int:id_tipo_documento>", methods=["GET"])
def ruta_buscar_tipo_documento(id_tipo_documento):
    respuesta, estado = servicio_buscar_tipo_documento(id_tipo_documento)

    return jsonify(respuesta), estado


@tipo_documento_bp.route("/actualizar/<int:id_tipo_documento>", methods=["PUT"])
def ruta_actualizar_tipo_documento(id_tipo_documento):
    datos = request.get_json()

    respuesta, estado = servicio_actualizar_tipo_documento(id_tipo_documento, datos)

    return jsonify(respuesta), estado


@tipo_documento_bp.route("/inhabilitar/<int:id_tipo_documento>", methods=["DELETE"])
def ruta_inhabilitar_tipo_documento(id_tipo_documento):
    respuesta, estado = servicio_inhabilitar_tipo_documento(id_tipo_documento)

    return jsonify(respuesta), estado
