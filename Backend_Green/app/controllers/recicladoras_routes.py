# Archivo: recicladoras_routes.py
# Este archivo crea las rutas para los duenos de punto ecologico.

from flask import Blueprint, request, jsonify

from app.services.recicladoras_service import (
    servicio_registrar_dueno_recicladora,
    servicio_listar_duenos_recicladora
)

from app.middlewares.auth_middleware import login_requerido
from app.middlewares.roles_middleware import rol_requerido


recicladoras_bp = Blueprint("recicladoras", __name__, url_prefix="/api/recicladoras")


@recicladoras_bp.route("/registro", methods=["POST"])
def ruta_registrar_dueno_recicladora():
    """
    Registrar dueno de punto ecologico
    ---
    tags:
      - Recicladoras
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
            - nit_empresa
            - nombre_empresa
            - direccion_empresa
          properties:
            nombres:
              type: string
              example: Ruth Mery
            apellidos:
              type: string
              example: Abello Yepes
            correo:
              type: string
              example: ruth@gmail.com
            usuario:
              type: string
              example: ruthrecicladora
            contrasena:
              type: string
              example: "12345678"
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
            nit_empresa:
              type: string
              example: "900123456-1"
            nombre_empresa:
              type: string
              example: Punto Verde Ruth
            direccion_empresa:
              type: string
              example: Calle 10 # 15-20
            telefono_empresa:
              type: string
              example: "6051234567"
            camara_comercio:
              type: string
              example: camara_ruth.pdf
    responses:
      201:
        description: Dueno de punto ecologico registrado correctamente
      400:
        description: Faltan datos obligatorios
    """

    datos = request.get_json()

    respuesta, estado = servicio_registrar_dueno_recicladora(datos)

    return jsonify(respuesta), estado


@recicladoras_bp.route("/listar", methods=["GET"])
@login_requerido
@rol_requerido([1])
def ruta_listar_duenos_recicladora():
    """
    Listar duenos de punto ecologico
    ---
    tags:
      - Recicladoras
    responses:
      200:
        description: Lista de duenos de punto ecologico
      401:
        description: No ha iniciado sesion
      403:
        description: No tiene permisos
    """

    respuesta, estado = servicio_listar_duenos_recicladora()

    return jsonify(respuesta), estado