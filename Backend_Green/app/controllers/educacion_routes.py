"""API consumida por ciudadano_educacion.html."""

from flask import Blueprint, g, jsonify

from app.middlewares.auth_middleware import login_requerido
from app.services.educacion_service import (
    servicio_aceptar_desafio,
    servicio_completar_contenido,
    servicio_completar_desafio,
    servicio_panel_educacion,
)


educacion_bp = Blueprint("educacion", __name__, url_prefix="/api/educacion")


@educacion_bp.get("")
@login_requerido
def panel_educacion():
    respuesta, estado = servicio_panel_educacion(g.id_usuario)
    return jsonify(respuesta), estado


@educacion_bp.post("/contenidos/<int:id_contenido>/completar")
@login_requerido
def completar_una_leccion(id_contenido):
    respuesta, estado = servicio_completar_contenido(g.id_usuario, id_contenido)
    return jsonify(respuesta), estado


@educacion_bp.post("/desafios/<int:id_desafio>/aceptar")
@login_requerido
def aceptar_un_desafio(id_desafio):
    respuesta, estado = servicio_aceptar_desafio(g.id_usuario, id_desafio)
    return jsonify(respuesta), estado


@educacion_bp.post("/desafios/<int:id_desafio>/completar")
@login_requerido
def completar_un_desafio(id_desafio):
    respuesta, estado = servicio_completar_desafio(g.id_usuario, id_desafio)
    return jsonify(respuesta), estado
