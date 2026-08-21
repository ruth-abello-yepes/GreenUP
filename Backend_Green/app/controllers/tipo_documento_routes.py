## Archivo: tipo_documento_routes.py
## Controlador HTTP: recibe peticiones, valida datos basicos y delega en servicios.

# Archivo: tipo_documento_routes.py
# Este archivo contiene las rutas del modulo tipo de documento.
#
# Rutas:
# POST   /api/tipo-documento/registrar
# GET    /api/tipo-documento/listar
# GET    /api/tipo-documento/buscar/<id_tipo_documento>
# PUT    /api/tipo-documento/actualizar/<id_tipo_documento>
# DELETE /api/tipo-documento/inhabilitar/<id_tipo_documento>

from flask import Blueprint, request, jsonify

from app.middlewares.auth_middleware import login_requerido
from app.middlewares.roles_middleware import rol_requerido
from app.services.tipo_documento_service import (
    servicio_registrar_tipo_documento,
    servicio_listar_tipos_documento,
    servicio_buscar_tipo_documento,
    servicio_actualizar_tipo_documento,
    servicio_inhabilitar_tipo_documento
)


tipo_documento_bp = Blueprint("tipo_documento", __name__, url_prefix="/api/tipo-documento")


@tipo_documento_bp.route("/registrar", methods=["POST"])
@login_requerido
@rol_requerido([1])
def ruta_registrar_tipo_documento():
    """
    Registrar tipo de documento
    ---
    tags:
      - Tipo documento
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - descripcion
          properties:
            descripcion:
              type: string
              example: Cedula de ciudadania
            id_estado:
              type: integer
              example: 1
    responses:
      201:
        description: Tipo de documento registrado correctamente
      400:
        description: Faltan datos obligatorios
    """

    datos = request.get_json()

    respuesta, estado = servicio_registrar_tipo_documento(datos)

    return jsonify(respuesta), estado


@tipo_documento_bp.route("/listar", methods=["GET"])
def ruta_listar_tipos_documento():
    """
    Listar tipos de documento
    ---
    tags:
      - Tipo documento
    responses:
      200:
        description: Lista de tipos de documento registrados
    """

    respuesta, estado = servicio_listar_tipos_documento()

    return jsonify(respuesta), estado


@tipo_documento_bp.route("/buscar/<int:id_tipo_documento>", methods=["GET"])
@login_requerido
@rol_requerido([1])
def ruta_buscar_tipo_documento(id_tipo_documento):
    """
    Buscar tipo de documento por ID
    ---
    tags:
      - Tipo documento
    parameters:
      - name: id_tipo_documento
        in: path
        required: true
        type: integer
        example: 1
    responses:
      200:
        description: Tipo de documento encontrado
      404:
        description: Tipo de documento no encontrado
    """

    respuesta, estado = servicio_buscar_tipo_documento(id_tipo_documento)

    return jsonify(respuesta), estado


@tipo_documento_bp.route("/actualizar/<int:id_tipo_documento>", methods=["PUT"])
@login_requerido
@rol_requerido([1])
def ruta_actualizar_tipo_documento(id_tipo_documento):
    """
    Actualizar tipo de documento
    ---
    tags:
      - Tipo documento
    parameters:
      - name: id_tipo_documento
        in: path
        required: true
        type: integer
        example: 1
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - descripcion
            - id_estado
          properties:
            descripcion:
              type: string
              example: Tarjeta de identidad
            id_estado:
              type: integer
              example: 1
    responses:
      200:
        description: Tipo de documento actualizado correctamente
      400:
        description: Faltan datos obligatorios
      404:
        description: Tipo de documento no encontrado
    """

    datos = request.get_json()

    respuesta, estado = servicio_actualizar_tipo_documento(id_tipo_documento, datos)

    return jsonify(respuesta), estado


@tipo_documento_bp.route("/inhabilitar/<int:id_tipo_documento>", methods=["DELETE"])
@login_requerido
@rol_requerido([1])
def ruta_inhabilitar_tipo_documento(id_tipo_documento):
    """
    Inhabilitar tipo de documento
    ---
    tags:
      - Tipo documento
    parameters:
      - name: id_tipo_documento
        in: path
        required: true
        type: integer
        example: 1
    responses:
      200:
        description: Tipo de documento inhabilitado correctamente
      404:
        description: Tipo de documento no encontrado
    """

    respuesta, estado = servicio_inhabilitar_tipo_documento(id_tipo_documento)

    return jsonify(respuesta), estado
