## Archivo: auth_middleware.py
## Middleware: valida autenticacion, permisos o datos antes de llegar a las rutas.

# Archivo: auth_middleware.py
# Revisa si el usuario envio sus datos de sesion en los headers.

from functools import wraps
from flask import request, jsonify, g
import os

import jwt


def login_requerido(funcion):
    @wraps(funcion)
    def decorador(*args, **kwargs):
        autorizacion = request.headers.get("Authorization", "")
        if autorizacion.startswith("Bearer "):
            token = autorizacion.replace("Bearer ", "", 1).strip()
            try:
                payload = jwt.decode(
                    token,
                    os.getenv("JWT_SECRET") or os.getenv("SECRET_KEY") or "greenup-dev-secret",
                    algorithms=["HS256"],
                )
                g.id_usuario = int(payload["id_usuario"])
                g.id_rol = int(payload["id_rol"])
                return funcion(*args, **kwargs)
            except jwt.ExpiredSignatureError:
                return jsonify({"mensaje": "La sesion expiro. Inicia sesion nuevamente"}), 401
            except jwt.InvalidTokenError:
                return jsonify({"mensaje": "Token invalido"}), 401

        # Aceptamos ambas formas:
        # id_usuario o id-usuario
        # id_rol o id-rol
        id_usuario = request.headers.get("id_usuario") or request.headers.get("id-usuario")
        id_rol = request.headers.get("id_rol") or request.headers.get("id-rol")

        if not id_usuario or not id_rol:
            return jsonify({
                "mensaje": "Debes iniciar sesion para usar esta ruta"
            }), 401

        g.id_usuario = int(id_usuario)
        g.id_rol = int(id_rol)

        return funcion(*args, **kwargs)

    return decorador
