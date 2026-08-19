## Archivo: reciclaje_service.py
## Servicio de negocio: valida reglas del sistema antes de llamar a modelos.

# Servicio de registrar reciclaje

from app.models.reciclaje_model import (
    buscar_usuario_recicladora_por_punto,
    crear_reciclaje,
    listar_reciclajes,
    listar_catalogo_reciclaje,
    listar_reciclajes_por_usuario,
    buscar_reciclaje,
    cambiar_estado_reciclaje
)
from app.models.notificaciones_model import crear_notificacion


def servicio_crear_reciclaje(data, id_usuario_sesion=None):
    """
    Valida y crea un registro de reciclaje pendiente para un ciudadano.
    """

    cantidad = data.get("cantidad")
    observaciones = data.get("observaciones") or data.get("observacion")
    id_usuario = id_usuario_sesion or data.get("id_usuario")
    id_tipo_material = data.get("id_tipo_material")
    id_punto = data.get("id_punto")

    if not cantidad:
        return {"mensaje": "La cantidad es obligatoria"}, 400

    if not id_usuario:
        return {"mensaje": "El usuario es obligatorio"}, 400

    if not id_tipo_material:
        return {"mensaje": "El material es obligatorio"}, 400

    if not id_punto:
        return {"mensaje": "Debes seleccionar un punto ecologico"}, 400

    try:
        cantidad = float(cantidad)
    except (TypeError, ValueError):
        return {"mensaje": "La cantidad debe ser numerica"}, 400

    if cantidad <= 0:
        return {"mensaje": "La cantidad debe ser mayor que cero"}, 400

    id_registro = crear_reciclaje(cantidad, observaciones, id_usuario, id_tipo_material, id_punto)

    id_recicladora = buscar_usuario_recicladora_por_punto(id_punto)
    if id_recicladora:
        crear_notificacion(
            "Nuevo reciclaje pendiente",
            "Tienes una entrega pendiente por confirmar en tu punto ecologico.",
            id_recicladora,
            None,
        )

    crear_notificacion(
        "Reciclaje enviado",
        "Tu registro fue enviado y quedo pendiente de confirmacion por la recicladora.",
        id_usuario,
        None,
    )

    return {
        "mensaje": "Reciclaje registrado correctamente y pendiente de confirmacion",
        "id_registro": id_registro,
        "estado": "pendiente",
    }, 201


def servicio_listar_reciclajes():
    datos = listar_reciclajes()
    return datos, 200


def servicio_buscar_reciclaje(id_registro):
    dato = buscar_reciclaje(id_registro)

    if not dato:
        return {"mensaje": "Registro no encontrado"}, 404

    return dato, 200


def servicio_listar_reciclajes_ciudadano(id_usuario):
    """
    Devuelve el historial del ciudadano autenticado.
    """

    return listar_reciclajes_por_usuario(id_usuario), 200


def servicio_catalogo_reciclaje():
    """
    Retorna los datos necesarios para construir el formulario del ciudadano.
    """

    return listar_catalogo_reciclaje(), 200


def servicio_cambiar_estado_reciclaje(id_registro, data):
    """
    Cambia el estado general de un reciclaje.

    Esta ruta queda disponible para acciones administrativas.
    """

    id_estado = data.get("id_estado")

    if not id_estado:
        return {"mensaje": "El estado es obligatorio"}, 400

    actualizado = cambiar_estado_reciclaje(
        id_registro,
        id_estado,
        data.get("puntos_obtenidos"),
        data.get("motivo_rechazo"),
        data.get("id_recicladora_confirma"),
    )

    if not actualizado:
        return {"mensaje": "Registro no encontrado"}, 404

    return {"mensaje": "Estado cambiado correctamente"}, 200
