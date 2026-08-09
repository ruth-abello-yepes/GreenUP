## Archivo: notificaciones_service.py
## Servicio de negocio: valida reglas del sistema antes de llamar a modelos.

from app.models.notificaciones_model import (
    crear_notificacion,
    listar_notificaciones,
    marcar_notificacion_leida,
)


def servicio_listar_notificaciones(id_usuario, id_rol):
    return listar_notificaciones(id_usuario, id_rol), 200


def servicio_crear_notificacion(datos):
    titulo = datos.get("titulo")
    mensaje = datos.get("mensaje")
    if not titulo or not mensaje:
        return {"mensaje": "Titulo y mensaje son obligatorios"}, 400

    id_notificacion = crear_notificacion(
        titulo,
        mensaje,
        datos.get("id_usuario"),
        datos.get("id_rol"),
    )
    return {"mensaje": "Notificacion creada correctamente", "id_notificacion": id_notificacion}, 201


def servicio_marcar_notificacion_leida(id_notificacion, id_usuario, id_rol):
    actualizado = marcar_notificacion_leida(id_notificacion, id_usuario, id_rol)
    if not actualizado:
        return {"mensaje": "Notificacion no encontrada"}, 404
    return {"mensaje": "Notificacion marcada como leida"}, 200
