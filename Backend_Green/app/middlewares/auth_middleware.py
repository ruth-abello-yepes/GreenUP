## Archivo: auth_middleware.py
## Middleware: valida autenticacion, permisos o datos antes de llegar a las rutas.

# Archivo: auth_middleware.py
# Revisa si el usuario envio un token JWT valido.

from functools import wraps

from flask import g, jsonify, request

import jwt
from app.common.jwt_config import JWT_ALGORITHM, obtener_jwt_secret


def login_requerido(funcion):
    """
    Protege una ruta que necesita usuario autenticado.

    Valida el JWT enviado por el frontend. No acepta id_usuario/id_rol desde
    headers manuales porque esos valores se pueden falsificar.
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
