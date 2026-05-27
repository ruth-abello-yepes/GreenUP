# Archivo: roles_routes.py
# Este archivo contiene las rutas del modulo de roles.
#
# Rutas:
# POST   /api/roles/registrar
# GET    /api/roles/listar
# GET    /api/roles/buscar/<id_rol>
# PUT    /api/roles/actualizar/<id_rol>
# DELETE /api/roles/inhabilitar/<id_rol>

from flask import Blueprint, request, jsonify

from app.services.roles_service import (
    servicio_registrar_rol,
    servicio_listar_roles,
    servicio_buscar_rol,
    servicio_actualizar_rol,
    servicio_inhabilitar_rol
)


roles_bp = Blueprint("roles", __name__, url_prefix="/api/roles")


@roles_bp.route("/registrar", methods=["POST"])
def ruta_registrar_rol():
    """
    Registrar rol
    ---
    tags:
      - Roles
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - nombre
            - descripcion
          properties:
            nombre:
              type: string
              example: Ciudadano
            descripcion:
              type: string
              example: Usuario general de la aplicacion
            id_estado:
              type: integer
              example: 1
    responses:
      201:
        description: Rol registrado correctamente
      400:
        description: Faltan datos obligatorios
    """

    datos = request.get_json()

    respuesta, estado = servicio_registrar_rol(datos)

    return jsonify(respuesta), estado


@roles_bp.route("/listar", methods=["GET"])
def ruta_listar_roles():
    """
    Listar roles
    ---
    tags:
      - Roles
    responses:
      200:
        description: Lista de roles registrados
    """

    respuesta, estado = servicio_listar_roles()

    return jsonify(respuesta), estado


@roles_bp.route("/buscar/<int:id_rol>", methods=["GET"])
def ruta_buscar_rol(id_rol):
    """
    Buscar rol por ID
    ---
    tags:
      - Roles
    parameters:
      - name: id_rol
        in: path
        required: true
        type: integer
        example: 1
    responses:
      200:
        description: Rol encontrado
      404:
        description: Rol no encontrado
    """

    respuesta, estado = servicio_buscar_rol(id_rol)

    return jsonify(respuesta), estado


@roles_bp.route("/actualizar/<int:id_rol>", methods=["PUT"])
def ruta_actualizar_rol(id_rol):
    """
    Actualizar rol
    ---
    tags:
      - Roles
    parameters:
      - name: id_rol
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
            - nombre
            - descripcion
            - id_estado
          properties:
            nombre:
              type: string
              example: Administrador
            descripcion:
              type: string
              example: Gestiona todo el sistema
            id_estado:
              type: integer
              example: 1
    responses:
      200:
        description: Rol actualizado correctamente
      400:
        description: Faltan datos obligatorios
      404:
        description: Rol no encontrado
    """

    datos = request.get_json()

    respuesta, estado = servicio_actualizar_rol(id_rol, datos)

    return jsonify(respuesta), estado


@roles_bp.route("/inhabilitar/<int:id_rol>", methods=["DELETE"])
def ruta_inhabilitar_rol(id_rol):
    """
    Inhabilitar rol
    ---
    tags:
      - Roles
    parameters:
      - name: id_rol
        in: path
        required: true
        type: integer
        example: 1
    responses:
      200:
        description: Rol inhabilitado correctamente
      404:
        description: Rol no encontrado
    """

    respuesta, estado = servicio_inhabilitar_rol(id_rol)

    return jsonify(respuesta), estado