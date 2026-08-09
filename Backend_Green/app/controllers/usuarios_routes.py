## Archivo: usuarios_routes.py
## Controlador HTTP: recibe peticiones, valida datos basicos y delega en servicios.

# Archivo: usuarios_routes.py
# Este archivo contiene las rutas relacionadas con usuarios.
#
# Rutas principales:
# POST /api/usuarios/registro      -> Registro publico de ciudadanos
# GET  /api/usuarios/listar        -> Admin lista todos los usuarios
# GET  /api/usuarios/ciudadanos    -> Admin lista solo ciudadanos

from flask import Blueprint, request, jsonify

from app.services.usuarios_service import (
    servicio_registrar_usuario,
    servicio_listar_usuarios,
    servicio_listar_ciudadanos,
    servicio_buscar_usuario,
    servicio_actualizar_usuario,
    servicio_inhabilitar_usuario,
    servicio_cambiar_estado_usuario
)

from app.middlewares.auth_middleware import login_requerido
from app.middlewares.roles_middleware import rol_requerido


usuarios_bp = Blueprint("usuarios", __name__, url_prefix="/api/usuarios")


@usuarios_bp.route("/registro", methods=["POST"])
def ruta_registrar_usuario():
    """
    Registrar ciudadano
    ---
    tags:
      - Usuarios
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - nombres
            - apellidos
            - correo
            - usuario
            - contrasena
            - numero_documento
            - id_tipo_documento
          properties:
            nombres:
              type: string
              example: Oreste Junior
            apellidos:
              type: string
              example: Suarez Leguia
            correo:
              type: string
              example: oreste@gmail.com
            usuario:
              type: string
              example: oreste
            contrasena:
              type: string
              example: "GreenUp2026!"
            numero_documento:
              type: string
              example: "1234567890"
            celular:
              type: string
              example: "3001234567"
            foto_perfil:
              type: string
              example: ""
            id_tipo_documento:
              type: integer
              example: 1
    responses:
      201:
        description: Ciudadano registrado correctamente
      400:
        description: Faltan datos obligatorios
    """

    datos = request.get_json()

    respuesta, estado = servicio_registrar_usuario(datos)

    return jsonify(respuesta), estado


@usuarios_bp.route("/listar", methods=["GET"])
@login_requerido
@rol_requerido([1])
def ruta_listar_usuarios():
    """
    Listar todos los usuarios
    ---
    tags:
      - Usuarios
    responses:
      200:
        description: Lista de usuarios registrados
      401:
        description: No ha iniciado sesion
      403:
        description: No tiene permisos de administrador
    """

    respuesta, estado = servicio_listar_usuarios()

    return jsonify(respuesta), estado


@usuarios_bp.route("/ciudadanos", methods=["GET"])
@login_requerido
@rol_requerido([1])
def ruta_listar_ciudadanos():
    """
    Listar ciudadanos
    ---
    tags:
      - Usuarios
    responses:
      200:
        description: Lista de ciudadanos registrados
      401:
        description: No ha iniciado sesion
      403:
        description: No tiene permisos de administrador
    """

    respuesta, estado = servicio_listar_ciudadanos()

    return jsonify(respuesta), estado


@usuarios_bp.route("/buscar/<int:id_usuario>", methods=["GET"])
@login_requerido
@rol_requerido([1])
def ruta_buscar_usuario(id_usuario):
    """
    Buscar usuario por ID
    ---
    tags:
      - Usuarios
    parameters:
      - name: id_usuario
        in: path
        required: true
        type: integer
        example: 1
    responses:
      200:
        description: Usuario encontrado
      404:
        description: Usuario no encontrado
    """

    respuesta, estado = servicio_buscar_usuario(id_usuario)

    return jsonify(respuesta), estado


@usuarios_bp.route("/actualizar/<int:id_usuario>", methods=["PUT"])
@login_requerido
@rol_requerido([1])
def ruta_actualizar_usuario(id_usuario):
    """
    Actualizar usuario
    ---
    tags:
      - Usuarios
    parameters:
      - name: id_usuario
        in: path
        required: true
        type: integer
        example: 1
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            nombres:
              type: string
              example: Anyeli Marian
            apellidos:
              type: string
              example: Chico Arrieta
            correo:
              type: string
              example: anyeli@gmail.com
            usuario:
              type: string
              example: anyeli
            numero_documento:
              type: string
              example: "1234567890"
            celular:
              type: string
              example: "3001234567"
            foto_perfil:
              type: string
              example: ""
            id_tipo_documento:
              type: integer
              example: 1
            id_rol:
              type: integer
              example: 3
            id_estado:
              type: integer
              example: 1
    responses:
      200:
        description: Usuario actualizado correctamente
      400:
        description: Faltan datos obligatorios
    """

    datos = request.get_json()

    respuesta, estado = servicio_actualizar_usuario(id_usuario, datos)

    return jsonify(respuesta), estado


@usuarios_bp.route("/inhabilitar/<int:id_usuario>", methods=["DELETE"])
@login_requerido
@rol_requerido([1])
def ruta_inhabilitar_usuario(id_usuario):
    """
    Inhabilitar usuario
    ---
    tags:
      - Usuarios
    parameters:
      - name: id_usuario
        in: path
        required: true
        type: integer
        example: 1
    responses:
      200:
        description: Usuario inhabilitado correctamente
    """

    respuesta, estado = servicio_inhabilitar_usuario(id_usuario)

    return jsonify(respuesta), estado


@usuarios_bp.route("/estado/<int:id_usuario>", methods=["PUT"])
@login_requerido
@rol_requerido([1])
def ruta_cambiar_estado_usuario(id_usuario):
    """
    Activar o inactivar usuario
    ---
    tags:
      - Usuarios
    description: El administrador cambia el estado de una cuenta existente.
    """

    datos = request.get_json()

    respuesta, estado = servicio_cambiar_estado_usuario(id_usuario, datos)

    return jsonify(respuesta), estado
