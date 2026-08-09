## Archivo: noticias_service.py
## Servicio de negocio: valida reglas del sistema antes de llamar a modelos.

from app.models.noticias_model import crear_noticia, listar_noticias, cambiar_estado_noticia


def servicio_crear_noticia(datos):
    titulo = datos.get("titulo")
    if not titulo:
        return {"mensaje": "El titulo es obligatorio"}, 400
    id_noticia = crear_noticia(
        titulo,
        datos.get("descripcion"),
        datos.get("imagen"),
        datos.get("id_usuario"),
    )
    return {"mensaje": "Noticia creada correctamente", "id_noticia": id_noticia}, 201


def servicio_listar_noticias():
    return listar_noticias(), 200


def servicio_cambiar_estado_noticia(id_noticia, datos):
    id_estado = datos.get("id_estado")
    if not id_estado:
        return {"mensaje": "El estado es obligatorio"}, 400
    actualizado = cambiar_estado_noticia(id_noticia, id_estado)
    if not actualizado:
        return {"mensaje": "Noticia no encontrada"}, 404
    return {"mensaje": "Estado de noticia actualizado correctamente"}, 200
