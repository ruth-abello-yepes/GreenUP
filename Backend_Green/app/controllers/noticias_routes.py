## Archivo: noticias_routes.py
## Controlador HTTP: recibe peticiones, valida datos basicos y delega en servicios.

from flask import Blueprint, jsonify, request

from app.services.noticias_service import (
    servicio_cambiar_estado_noticia,
    servicio_crear_noticia,
    servicio_listar_noticias_ambientales,
    servicio_listar_noticias,
)


noticias_bp = Blueprint("noticias", __name__)


@noticias_bp.route("/api/noticias/ambientales", methods=["GET"])
def ruta_listar_noticias_ambientales():
    busqueda = (request.args.get("buscar") or "").strip()[:100] or None
    try:
        pagina = max(1, int(request.args.get("pagina", 1)))
        por_pagina = min(20, max(1, int(request.args.get("por_pagina", 9))))
    except (TypeError, ValueError):
        return jsonify({"mensaje": "La paginación no es válida"}), 400

    respuesta, estado = servicio_listar_noticias_ambientales(busqueda, pagina, por_pagina)
    salida = jsonify(respuesta)
    salida.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    return salida, estado


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
