## Archivo: comunidad_routes.py
## Rutas HTTP del foro y del juego educativo por noticias.

from flask import Blueprint, g, jsonify, request

from app.middlewares.auth_middleware import login_requerido
from app.middlewares.roles_middleware import rol_requerido
from app.services.comunidad_service import (
    servicio_crear_tema_foro,
    servicio_listar_foro,
    servicio_listar_preguntas_noticia,
    servicio_listar_puntajes_juego,
    servicio_puntaje_ciudadano,
    servicio_responder_tema_foro,
    servicio_resolver_juego_noticia,
)


comunidad_bp = Blueprint("comunidad", __name__, url_prefix="/api/comunidad")


@comunidad_bp.route("/foro", methods=["GET"])
@login_requerido
def ruta_listar_foro():
    respuesta, estado = servicio_listar_foro(g.id_rol)
    return jsonify(respuesta), estado


@comunidad_bp.route("/foro", methods=["POST"])
@login_requerido
@rol_requerido([1, 2])
def ruta_crear_tema_foro():
    datos = request.get_json() or {}
    respuesta, estado = servicio_crear_tema_foro(g.id_usuario, g.id_rol, datos)
    return jsonify(respuesta), estado


@comunidad_bp.route("/foro/<int:id_tema>/respuestas", methods=["POST"])
@login_requerido
@rol_requerido([1, 2, 3])
def ruta_responder_tema_foro(id_tema):
    datos = request.get_json() or {}
    respuesta, estado = servicio_responder_tema_foro(id_tema, g.id_usuario, g.id_rol, datos)
    return jsonify(respuesta), estado


@comunidad_bp.route("/juego/noticias/<int:id_noticia>/preguntas", methods=["GET"])
@login_requerido
def ruta_listar_preguntas_noticia(id_noticia):
    respuesta, estado = servicio_listar_preguntas_noticia(id_noticia)
    return jsonify(respuesta), estado


@comunidad_bp.route("/juego/noticias/<int:id_noticia>/resolver", methods=["POST"])
@login_requerido
@rol_requerido([3])
def ruta_resolver_juego_noticia(id_noticia):
    datos = request.get_json() or {}
    respuesta, estado = servicio_resolver_juego_noticia(g.id_usuario, id_noticia, datos)
    return jsonify(respuesta), estado


@comunidad_bp.route("/juego/puntajes", methods=["GET"])
@login_requerido
@rol_requerido([1])
def ruta_listar_puntajes_juego():
    respuesta, estado = servicio_listar_puntajes_juego()
    return jsonify(respuesta), estado


@comunidad_bp.route("/juego/mi-puntaje", methods=["GET"])
@login_requerido
@rol_requerido([3])
def ruta_puntaje_ciudadano():
    respuesta, estado = servicio_puntaje_ciudadano(g.id_usuario)
    return jsonify(respuesta), estado
