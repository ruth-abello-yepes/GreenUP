from flask import Blueprint, request, jsonify
from app.services.auth_service import servicio_login


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def ruta_login():
    """
    Iniciar sesion
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
              example: anyeli
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
        description: Usuario inactivo
      404:
        description: Usuario no encontrado
    """
    datos = request.get_json()

    respuesta, estado = servicio_login(datos)

    return jsonify(respuesta), estado