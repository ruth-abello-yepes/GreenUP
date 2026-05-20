# Servicio de novedades

from app.models.novedades_model import (
    crear_novedad,
    listar_novedades,
    buscar_novedad,
    cambiar_estado_novedad
)


def servicio_crear_novedad(data):
    titulo = data.get("titulo")
    descripcion = data.get("descripcion")
    imagen = data.get("imagen")
    id_usuario = data.get("id_usuario")

    if not titulo:
        return {"mensaje": "El título es obligatorio"}, 400

    if not id_usuario:
        return {"mensaje": "El usuario es obligatorio"}, 400

    crear_novedad(titulo, descripcion, imagen, id_usuario)

    return {"mensaje": "Novedad creada correctamente"}, 201


def servicio_listar_novedades():
    datos = listar_novedades()
    return datos, 200


def servicio_buscar_novedad(id_novedad):
    dato = buscar_novedad(id_novedad)

    if not dato:
        return {"mensaje": "Novedad no encontrada"}, 404

    return dato, 200


def servicio_cambiar_estado_novedad(id_novedad, data):
    id_estado = data.get("id_estado")

    if not id_estado:
        return {"mensaje": "El estado es obligatorio"}, 400

    cambiar_estado_novedad(id_novedad, id_estado)

    return {"mensaje": "Estado cambiado correctamente"}, 200