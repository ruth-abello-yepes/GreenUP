## Archivo: roles_middleware.py
## Middleware: valida autenticacion, permisos o datos antes de llegar a las rutas.

# Archivo: roles_middleware.py
# Este middleware revisa si el usuario tiene el rol permitido.

from functools import wraps
from flask import jsonify, g


def rol_requerido(roles_permitidos):
    def decorador_principal(funcion):
        @wraps(funcion)
        def decorador(*args, **kwargs):
            if g.id_rol not in roles_permitidos:
                return jsonify({
                    "mensaje": "No tienes permisos para usar esta ruta"
                }), 403

            return funcion(*args, **kwargs)

        return decorador

    return decorador_principal