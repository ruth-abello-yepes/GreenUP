## Archivo: auth_routes.py
## Controlador HTTP: recibe peticiones, valida datos basicos y delega en servicios.

"""
Archivo: auth_routes.py

Aqui se crean las rutas de inicio de sesion y recuperacion de contraseña.

Rutas:
POST /api/login
    Login normal para ciudadano y dueno de punto ecologico.

POST /api/admin/login
    Login exclusivo para administrador del sistema.

POST /api/recuperar-contrasena/solicitar
    Solicitud de codigo de 6 digitos al correo.

POST /api/recuperar-contrasena/restablecer
    Verificacion del codigo y cambio de contraseña.
"""

from flask import Blueprint, g, request, jsonify
import logging
from psycopg2 import DatabaseError, OperationalError

from app.services.auth_service import (
    cambiar_contrasena_desde_perfil,
    servicio_login, 
    servicio_login_admin,
    solicitar_codigo_recuperacion,
    solicitar_codigo_verificacion_correo,
    confirmar_codigo_verificacion_correo,
    verificar_codigo_recuperacion,
    restablecer_contrasena
)
from app.middlewares.auth_middleware import login_requerido
from app.common.security import verificar_captcha
from app.common.security_audit import registrar_evento


# No usamos url_prefix="/api/auth" para que las rutas sean mas cortas.
auth_bp = Blueprint("auth", __name__, url_prefix="/api")
logger_seguridad = logging.getLogger("greenup.security")


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
              example: "GreenUp2026!"
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

    datos = request.get_json() or {}

    if not verificar_captcha(datos.get("captcha_token"), request.remote_addr):
        registrar_evento("captcha_rechazado", request, detalle="login")
        return jsonify({"mensaje": "No se pudo validar el CAPTCHA. Intenta nuevamente."}), 403

    try:
        respuesta, estado = servicio_login(datos)
    except (OperationalError, DatabaseError) as error:
        print(f"Error de base de datos en login GreenUP: {error}")
        return jsonify({
            "mensaje": "Base de datos no disponible. Revisa la conexion de Render con Supabase."
        }), 503

    logger_seguridad.info("login_normal resultado=%s ip=%s", estado, request.remote_addr)
    registrar_evento("login_usuario", request, detalle=f"status={estado}")
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
              example: "GreenUp2026!"
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

    datos = request.get_json() or {}

    if not verificar_captcha(datos.get("captcha_token"), request.remote_addr):
        registrar_evento("captcha_rechazado", request, detalle="login_admin")
        return jsonify({"mensaje": "No se pudo validar el CAPTCHA. Intenta nuevamente."}), 403

    try:
        respuesta, estado = servicio_login_admin(datos)
    except (OperationalError, DatabaseError) as error:
        print(f"Error de base de datos en login admin GreenUP: {error}")
        return jsonify({
            "mensaje": "Base de datos no disponible. Revisa la conexion de Render con Supabase."
        }), 503

    logger_seguridad.info("login_admin resultado=%s ip=%s", estado, request.remote_addr)
    registrar_evento("login_admin", request, detalle=f"status={estado}")
    return jsonify(respuesta), estado


@auth_bp.route("/recuperar-contrasena/solicitar", methods=["POST"])
def ruta_solicitar_codigo():
    """
    Solicitar código de recuperación
    ---
    tags:
      - Recuperar Contraseña
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - correo
          properties:
            correo:
              type: string
              example: usuario@gmail.com
    responses:
      200:
        description: Código enviado si el correo existe
      400:
        description: El correo es obligatorio
      500:
        description: Error al enviar el correo
    """
    datos = request.get_json() or {}
    respuesta, estado = solicitar_codigo_recuperacion(datos)
    return jsonify(respuesta), estado


@auth_bp.route("/verificar-correo/solicitar", methods=["POST"])
def ruta_solicitar_verificacion_correo():
    respuesta, estado = solicitar_codigo_verificacion_correo(request.get_json() or {})
    return jsonify(respuesta), estado


@auth_bp.route("/verificar-correo/confirmar", methods=["POST"])
def ruta_confirmar_verificacion_correo():
    respuesta, estado = confirmar_codigo_verificacion_correo(request.get_json() or {})
    return jsonify(respuesta), estado


@auth_bp.route("/recuperar-contrasena/restablecer", methods=["POST"])
def ruta_restablecer_contrasena():
    """
    Restablecer contraseña con código
    ---
    tags:
      - Recuperar Contraseña
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - correo
            - codigo
            - nueva_contrasena
          properties:
            correo:
              type: string
              example: usuario@gmail.com
            codigo:
              type: string
              example: "123456"
            nueva_contrasena:
              type: string
              example: "NuevaClave2026!"
    responses:
      200:
        description: Contraseña actualizada con éxito
      400:
        description: Código inválido, expirado o faltan datos
    """
    datos = request.get_json() or {}
    respuesta, estado = restablecer_contrasena(datos)
    return jsonify(respuesta), estado


@auth_bp.route("/recuperar-contrasena/verificar", methods=["POST"])
def ruta_verificar_codigo():
    """
    Verificar codigo de recuperacion
    ---
    tags:
      - Recuperar Contraseña
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - correo
            - codigo
          properties:
            correo:
              type: string
              example: usuario@gmail.com
            codigo:
              type: string
              example: "123456"
    responses:
      200:
        description: Codigo correcto
      400:
        description: Codigo invalido o expirado
    """
    datos = request.get_json() or {}
    respuesta, estado = verificar_codigo_recuperacion(datos)
    return jsonify(respuesta), estado


@auth_bp.route("/perfil/cambiar-contrasena", methods=["PUT"])
@login_requerido
def ruta_cambiar_contrasena_desde_perfil():
    datos = request.get_json() or {}
    respuesta, estado = cambiar_contrasena_desde_perfil(g.id_usuario, datos)
    return jsonify(respuesta), estado
