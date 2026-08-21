## Archivo: contenido_routes.py
## Controlador HTTP: recibe peticiones, valida datos basicos y delega en servicios.

# Rutas de contenido educativo

from flask import Blueprint, g, request, jsonify

from app.middlewares.auth_middleware import login_requerido
from app.middlewares.roles_middleware import rol_requerido
from app.services.contenido_service import (
    servicio_cambiar_estado_contenido,
    servicio_crear_contenido,
    servicio_listar_contenidos
)


contenido_bp = Blueprint("contenido", __name__)


@contenido_bp.route("/contenido", methods=["POST"])
@login_requerido
@rol_requerido([1, 2])
def ruta_crear_contenido():
    """
    Crear contenido educativo
    ---
    tags:
      - Contenido Educativo
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - titulo
            - tipo
            - id_usuario
          properties:
            titulo:
              type: string
              example: Como reciclar plastico
            descripcion:
              type: string
              example: Guia basica para separar plastico reciclable.
            tipo:
              type: string
              example: articulo
            url_recurso:
              type: string
              example: https://ejemplo.com/reciclaje-plastico
            imagen:
              type: string
              example: imagenes/plastico.jpg
            id_usuario:
              type: integer
              example: 1
    responses:
      201:
        description: Contenido creado correctamente
      400:
        description: Faltan datos obligatorios
    """
    data = request.get_json()
    data["id_usuario"] = g.id_usuario
    respuesta, estado = servicio_crear_contenido(data)
    return jsonify(respuesta), estado


@contenido_bp.route("/contenido", methods=["GET"])
def ruta_listar_contenidos():
    """
    Listar contenidos educativos
    ---
    tags:
      - Contenido Educativo
    responses:
      200:
        description: Lista de contenidos educativos
    """
    respuesta, estado = servicio_listar_contenidos()
    return jsonify(respuesta), estado


@contenido_bp.route("/contenido/<int:id_contenido>/estado", methods=["PUT"])
@login_requerido
@rol_requerido([1, 2])
def ruta_cambiar_estado_contenido(id_contenido):
    data = request.get_json() or {}
    respuesta, estado = servicio_cambiar_estado_contenido(id_contenido, data)
    return jsonify(respuesta), estado
