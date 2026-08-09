## Archivo: noticias_routes.py
## Controlador HTTP: recibe peticiones, valida datos basicos y delega en servicios.

from flask import Blueprint, jsonify, request

from app.services.noticias_service import (
    servicio_cambiar_estado_noticia,
    servicio_crear_noticia,
    servicio_listar_noticias,
)


noticias_bp = Blueprint("noticias", __name__)


@noticias_bp.route("/noticias", methods=["GET"])
def ruta_listar_noticias():
    respuesta, estado = servicio_listar_noticias()
    return jsonify(respuesta), estado


@noticias_bp.route("/noticias", methods=["POST"])
def ruta_crear_noticia():
    datos = request.get_json() or {}
    respuesta, estado = servicio_crear_noticia(datos)
    return jsonify(respuesta), estado


@noticias_bp.route("/noticias/<int:id_noticia>/estado", methods=["PUT"])
def ruta_cambiar_estado_noticia(id_noticia):
    datos = request.get_json() or {}
    respuesta, estado = servicio_cambiar_estado_noticia(id_noticia, datos)
    return jsonify(respuesta), estado
