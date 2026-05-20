# Servicio de contenido educativo

from app.models.contenido_model import (
    crear_contenido,
    listar_contenidos
)


def servicio_crear_contenido(data):
    titulo = data.get("titulo")
    descripcion = data.get("descripcion")
    tipo = data.get("tipo")
    url_recurso = data.get("url_recurso")
    imagen = data.get("imagen")
    id_usuario = data.get("id_usuario")

    if not titulo:
        return {"mensaje": "El título es obligatorio"}, 400

    if not tipo:
        return {"mensaje": "El tipo de contenido es obligatorio"}, 400

    if not id_usuario:
        return {"mensaje": "El usuario es obligatorio"}, 400

    crear_contenido(titulo, descripcion, tipo, url_recurso, imagen, id_usuario)

    return {"mensaje": "Contenido creado correctamente"}, 201


def servicio_listar_contenidos():
    datos = listar_contenidos()
    return datos, 200