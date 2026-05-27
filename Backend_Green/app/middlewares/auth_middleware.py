# Archivo: auth_middleware.py
# Revisa si el usuario envio sus datos de sesion en los headers.

from functools import wraps
from flask import request, jsonify, g


def login_requerido(funcion):
    @wraps(funcion)
    def decorador(*args, **kwargs):
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