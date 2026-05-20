from functools import wraps # Para crear decoradores en Python
from flask import request, jsonify # Para manejar las solicitudes HTTP y enviar respuestas JSON


def login_requerido(funcion):
    @wraps(funcion)
    def decorador(*args, **kwargs):
        id_usuario = request.headers.get("id_usuario") # Se espera que el cliente envíe el id_usuario en los encabezados de la solicitud

        if not id_usuario:
            return jsonify({"mensaje": "Debes iniciar sesion para usar esta ruta"}), 401

        return funcion(*args, **kwargs)

    return decorador