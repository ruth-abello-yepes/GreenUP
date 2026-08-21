## Archivo: auth_middleware.py
## Middleware: valida autenticacion, permisos o datos antes de llegar a las rutas.

# Archivo: auth_middleware.py
# Revisa si el usuario envio sus datos de sesion en los headers.

import os
from functools import wraps

from flask import g, jsonify, request

import jwt
from app.common.jwt_config import JWT_ALGORITHM, obtener_jwt_secret


def _permitir_headers_de_desarrollo():
    """
    Indica si se aceptan headers manuales de usuario y rol.

    En produccion debe estar apagado porque esos headers se pueden falsificar.
    Solo se usa como ayuda local si el equipo configura:
    GREENUP_PERMITIR_HEADERS_DEV=true
    """

    valor = (os.getenv("GREENUP_PERMITIR_HEADERS_DEV") or "").strip().lower()
    return valor in ("1", "true", "si", "yes")


def login_requerido(funcion):
    """
    Protege una ruta que necesita usuario autenticado.

    Primero valida el JWT enviado por el frontend. Si no hay JWT, solo permite
    headers manuales cuando el entorno local lo autoriza de manera explicita.
    """

    @wraps(funcion)
    def decorador(*args, **kwargs):
        autorizacion = request.headers.get("Authorization", "")
        if autorizacion.startswith("Bearer "):
            token = autorizacion.replace("Bearer ", "", 1).strip()
            try:
                payload = jwt.decode(
                    token,
                    obtener_jwt_secret(),
                    algorithms=[JWT_ALGORITHM],
                )
                g.id_usuario = int(payload["id_usuario"])
                g.id_rol = int(payload["id_rol"])
                return funcion(*args, **kwargs)
            except jwt.ExpiredSignatureError:
                return jsonify({"mensaje": "La sesion expiro. Inicia sesion nuevamente"}), 401
            except jwt.InvalidTokenError:
                return jsonify({"mensaje": "Token invalido"}), 401

        return jsonify({
            "mensaje": "Debes iniciar sesion con un token valido para usar esta ruta"
        }), 401

    return decorador
