from functools import wraps # Para crear decoradores en Python
from flask import request, jsonify # Para manejar las solicitudes HTTP y enviar respuestas JSON


def rol_requerido(roles_permitidos): # roles_permitidos es una lista de los id_rol que tienen permiso para acceder a la ruta decorada
    def decorador(funcion):
        @wraps(funcion) # Para que el decorador no pierda la informacion de la funcion original (nombre, docstring, etc)
        def wrapper(*args, **kwargs): # wrapper es la funcion que se ejecuta en lugar de la funcion original, y recibe los mismos argumentos
            id_rol = request.headers.get("id_rol")

            if not id_rol:
                return jsonify({"mensaje": "No se envio el rol del usuario"}), 401

            id_rol = int(id_rol)

            if id_rol not in roles_permitidos:
                return jsonify({"mensaje": "No tienes permisos para esta accion"}), 403

            return funcion(*args, **kwargs) 

        return wrapper

    return decorador # Para que el decorador pueda recibir argumentos (en este caso, la lista de roles permitidos)


# Un decorador en Python es una forma de poner una función “encima” de otra para agregarle una revisión antes de ejecutarla