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
    cambiar_estado_reciclaje,
    punto_acepta_material,
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

    if not punto_acepta_material(id_punto, id_tipo_material):
        return {
            "mensaje": "El punto ecológico seleccionado no recibe ese material. Elige un material aceptado por la recicladora."
        }, 400

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
    """
    Busca un registro para administracion interna.

    Se conserva para no romper llamadas antiguas del backend.
    """

    dato = buscar_reciclaje(id_registro)

    if not dato:
        return {"mensaje": "Registro no encontrado"}, 404

    return dato, 200


def servicio_buscar_reciclaje_autorizado(id_registro, id_usuario, id_rol):
    """
    Busca un reciclaje respetando permisos por rol.

    - Administrador: puede consultar todos.
    - Ciudadano: solo sus propios registros.
    - Recicladora: solo registros del punto que administra.
    """

    dato = buscar_reciclaje(id_registro)

    if not dato:
        return {"mensaje": "Registro no encontrado"}, 404

    if int(id_rol) == 1:
        return dato, 200

    if int(id_rol) == 3 and int(dato.get("id_usuario") or 0) == int(id_usuario):
        return dato, 200

    if int(id_rol) == 2:
        id_recicladora = buscar_usuario_recicladora_por_punto(dato.get("id_punto"))
        if id_recicladora and int(id_recicladora) == int(id_usuario):
            return dato, 200

    return {"mensaje": "No tienes permisos para consultar este reciclaje"}, 403


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

    try:
        id_estado = int(id_estado)
    except (TypeError, ValueError):
        return {"mensaje": "El estado no es valido"}, 400

    if id_estado not in (2, 3):
        return {"mensaje": "Solo se permite confirmar o rechazar reciclajes pendientes"}, 400

    registro = buscar_reciclaje(id_registro)
    if not registro:
        return {"mensaje": "Registro no encontrado"}, 404

    estado_actual = str(registro.get("estado") or registro.get("estado_legible") or "").strip().lower()
    if estado_actual in ("confirmado", "rechazado") or int(registro.get("id_estado") or 0) in (2, 3):
        return {"mensaje": "Este reciclaje ya fue procesado y no puede cambiar otra vez"}, 409

    puntos_obtenidos = 0
    motivo_rechazo = data.get("motivo_rechazo")

    if id_estado == 2:
        puntos_obtenidos = int(round(
            float(registro.get("cantidad") or 0) * float(registro.get("puntos_por_kg") or 0),
            0,
        ))

    if id_estado == 3 and not motivo_rechazo:
        motivo_rechazo = "El administrador rechazo el reciclaje durante la validacion."

    actualizado = cambiar_estado_reciclaje(
        id_registro,
        id_estado,
        puntos_obtenidos,
        motivo_rechazo,
        data.get("id_recicladora_confirma"),
    )

    if not actualizado:
        return {"mensaje": "Registro no encontrado o ya procesado"}, 409

    if id_estado == 2:
        crear_notificacion(
            "Reciclaje confirmado",
            f"Tu entrega de {registro.get('material') or 'material reciclable'} fue confirmada y sumaste {puntos_obtenidos} Ecopuntos.",
            registro.get("id_usuario"),
            None,
        )
    elif id_estado == 3:
        crear_notificacion(
            "Reciclaje rechazado",
            f"Tu entrega fue rechazada. Motivo: {motivo_rechazo}.",
            registro.get("id_usuario"),
            None,
        )

    return {"mensaje": "Estado cambiado correctamente"}, 200
