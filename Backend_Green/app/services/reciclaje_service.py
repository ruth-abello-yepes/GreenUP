## Archivo: reciclaje_service.py
## Servicio de negocio: valida reglas del sistema antes de llamar a modelos.

# Servicio de registrar reciclaje

from app.models.reciclaje_model import (
    crear_reciclaje,
    listar_reciclajes,
    buscar_reciclaje,
    cambiar_estado_reciclaje
)


def servicio_crear_reciclaje(data):
    """Valida y crea un registro de reciclaje."""

    cantidad = data.get("cantidad")
    observaciones = data.get("observaciones")
    id_usuario = data.get("id_usuario")
    id_tipo_material = data.get("id_tipo_material")
    id_punto = data.get("id_punto")

    if not cantidad:
        return {"mensaje": "La cantidad es obligatoria"}, 400

    if not id_usuario:
        return {"mensaje": "El usuario es obligatorio"}, 400

    if not id_tipo_material:
        return {"mensaje": "El material es obligatorio"}, 400

    crear_reciclaje(cantidad, observaciones, id_usuario, id_tipo_material, id_punto)

    return {"mensaje": "Reciclaje registrado correctamente"}, 201


def servicio_listar_reciclajes():
    datos = listar_reciclajes()
    return datos, 200


def servicio_buscar_reciclaje(id_registro):
    dato = buscar_reciclaje(id_registro)

    if not dato:
        return {"mensaje": "Registro no encontrado"}, 404

    return dato, 200


def servicio_cambiar_estado_reciclaje(id_registro, data):
    id_estado = data.get("id_estado")

    if not id_estado:
        return {"mensaje": "El estado es obligatorio"}, 400

    cambiar_estado_reciclaje(id_registro, id_estado)

    return {"mensaje": "Estado cambiado correctamente"}, 200