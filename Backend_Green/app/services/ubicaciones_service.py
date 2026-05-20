# Servicio de puntos de reciclaje

from app.models.ubicaciones_model import (
    crear_ubicacion,
    listar_ubicaciones
)


def servicio_crear_ubicacion(data):

    nombre = data.get("nombre")
    direccion = data.get("direccion")
    horario = data.get("horario")

    if not nombre:
        return {"mensaje": "El nombre es obligatorio"}, 400

    crear_ubicacion(nombre, direccion, horario)

    return {"mensaje": "Punto creado correctamente"}, 201


def servicio_listar_ubicaciones():

    data = listar_ubicaciones()

    return data, 200
