# Servicio de puntos de reciclaje.
# Aqui se validan los datos antes de guardarlos en Supabase.

from app.models.ubicaciones_model import (
    crear_ubicacion,
    listar_ubicaciones,
    cambiar_estado_ubicacion
)


def servicio_crear_ubicacion(data):

    nombre = data.get("nombre")
    direccion = data.get("direccion")
    horario = data.get("horario")
    latitud = data.get("latitud")
    longitud = data.get("longitud")
    telefono = data.get("telefono")
    responsable = data.get("responsable")
    id_estado = data.get("id_estado", 1)

    if not nombre:
        return {"mensaje": "El nombre es obligatorio"}, 400

    if not direccion:
        return {"mensaje": "La direccion es obligatoria"}, 400

    id_punto = crear_ubicacion(
        nombre,
        direccion,
        horario,
        latitud,
        longitud,
        telefono,
        responsable,
        id_estado
    )

    return {
        "mensaje": "Punto creado correctamente",
        "id_punto": id_punto
    }, 201


def servicio_listar_ubicaciones():

    data = listar_ubicaciones()

    return data, 200


def servicio_cambiar_estado_ubicacion(id_punto, data):
    """
    Activa o inactiva un punto ecologico existente.

    Esta accion es administrativa: no crea puntos nuevos, solo cambia el estado
    de registros que ya estan en la tabla puntos_reciclaje.
    """

    id_estado = data.get("id_estado")

    if not id_estado:
        return {"mensaje": "El estado es obligatorio"}, 400

    cambiar_estado_ubicacion(id_punto, id_estado)

    return {"mensaje": "Estado del punto actualizado correctamente"}, 200
