"""
Archivo: auth_routes.py

Aqui se crean las rutas de inicio de sesion.

Rutas:
POST /api/login
    Login normal para ciudadano y dueno de punto ecologico.

POST /api/admin/login
    Login exclusivo para administrador del sistema.
"""

from flask import Blueprint, request, jsonify

from app.services.auth_service import servicio_login, servicio_login_admin


# No usamos url_prefix="/api/auth" para que las rutas sean mas cortas.
auth_bp = Blueprint("auth", __name__, url_prefix="/api")


@auth_bp.route("/login", methods=["POST"])
def ruta_login():
    """
    Login normal
    ---
    tags:
      - Auth
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - usuario
            - contrasena
          properties:
            usuario:
              type: string
              example: ciudadano1
            contrasena:
              type: string
              example: "12345678"
    responses:
      200:
        description: Inicio de sesion correcto
      400:
        description: Usuario y contrasena son obligatorios
      401:
        description: Contrasena incorrecta
      403:
        description: Usuario inactivo o administrador usando login incorrecto
      404:
        description: Usuario no encontrado
    """

    datos = request.get_json()

    respuesta, estado = servicio_login(datos)

    return jsonify(respuesta), estado


@auth_bp.route("/admin/login", methods=["POST"])
def ruta_login_admin():
    """
    Login administrador
    ---
    tags:
      - Auth Admin
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - usuario
            - contrasena
            - codigo_admin
          properties:
            usuario:
              type: string
              example: anyeli
            contrasena:
              type: string
              example: "12345678"
            codigo_admin:
              type: string
              example: GREENUP-ADMIN-2026
    responses:
      200:
        description: Inicio de sesion administrador correcto
      400:
        description: Faltan datos obligatorios
      401:
        description: Contrasena o codigo admin incorrecto
      403:
        description: Usuario inactivo o sin permisos de administrador
      404:
        description: Administrador no encontrado
    """

    datos = request.get_json()

    respuesta, estado = servicio_login_admin(datos)

    return jsonify(respuesta), estado