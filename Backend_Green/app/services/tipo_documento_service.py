## Archivo: tipo_documento_service.py
## Servicio de negocio: valida reglas del sistema antes de llamar a modelos.

from app.models.tipo_documento_model import registrar_tipo_documento, listar_tipos_documento, buscar_tipo_documento_por_id, actualizar_tipo_documento, inhabilitar_tipo_documento


def servicio_registrar_tipo_documento(datos):
    descripcion = datos.get("descripcion")
    id_estado = 1

    if not descripcion:
        return {"mensaje": "La descripcion es obligatoria"}, 400

    registrar_tipo_documento(descripcion, id_estado)

    return {"mensaje": "Tipo de documento registrado correctamente"}, 201


def servicio_listar_tipos_documento():
    tipos_documento = listar_tipos_documento()
    return tipos_documento, 200


def servicio_buscar_tipo_documento(id_tipo_documento):
    tipo_documento = buscar_tipo_documento_por_id(id_tipo_documento)

    if tipo_documento is None:
        return {"mensaje": "Tipo de documento no encontrado"}, 404

    return tipo_documento, 200


def servicio_actualizar_tipo_documento(id_tipo_documento, datos):
    descripcion = datos.get("descripcion")
    id_estado = datos.get("id_estado")

    if not descripcion:
        return {"mensaje": "La descripcion es obligatoria"}, 400

    actualizar_tipo_documento(id_tipo_documento, descripcion, id_estado)

    return {"mensaje": "Tipo de documento actualizado correctamente"}, 200


def servicio_inhabilitar_tipo_documento(id_tipo_documento):
    inhabilitar_tipo_documento(id_tipo_documento)
    return {"mensaje": "Tipo de documento inhabilitado correctamente"}, 200
