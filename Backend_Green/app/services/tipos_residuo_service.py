## Archivo: tipos_residuo_service.py
## Servicio de negocio: valida reglas del sistema antes de llamar a modelos.

# Servicio de tipos de residuo
# Aquí se validan los datos antes de usar el modelo.

from app.models.tipos_residuo_model import (
    crear_tipo_residuo,
    listar_tipos_residuo,
    buscar_tipo_residuo,
    editar_tipo_residuo,
    cambiar_estado_tipo_residuo
)


def servicio_crear_tipo_residuo(data):
    """Valida y crea un tipo de residuo."""

    nombre = data.get("nombre")
    descripcion = data.get("descripcion")
    color_contenedor = data.get("color_contenedor")

    if not nombre:
        return {"mensaje": "El nombre es obligatorio"}, 400

    crear_tipo_residuo(nombre, descripcion, color_contenedor)

    return {"mensaje": "Tipo de residuo creado correctamente"}, 201


def servicio_listar_tipos_residuo():
    """Retorna todos los tipos de residuo."""

    datos = listar_tipos_residuo()
    return datos, 200


def servicio_buscar_tipo_residuo(id_tipo_residuo):
    """Busca un tipo de residuo por ID."""

    dato = buscar_tipo_residuo(id_tipo_residuo)

    if not dato:
        return {"mensaje": "Tipo de residuo no encontrado"}, 404

    return dato, 200


def servicio_editar_tipo_residuo(id_tipo_residuo, datos):
    """Valida y edita un tipo de residuo."""

    dato = buscar_tipo_residuo(id_tipo_residuo)

    if not dato:
        return {"mensaje": "Tipo de residuo no encontrado"}, 404

    nombre = datos.get("nombre")
    descripcion = datos.get("descripcion")
    color_contenedor = datos.get("color_contenedor")

    if not nombre:
        return {"mensaje": "El nombre es obligatorio"}, 400

    editar_tipo_residuo(id_tipo_residuo, nombre, descripcion, color_contenedor)

    return {"mensaje": "Tipo de residuo editado correctamente"}, 200


def servicio_cambiar_estado_tipo_residuo(id_tipo_residuo, data):
    """Cambia el estado de un tipo de residuo."""

    id_estado = data.get("id_estado")

    if not id_estado:
        return {"mensaje": "El estado es obligatorio"}, 400

    cambiar_estado_tipo_residuo(id_tipo_residuo, id_estado)

    return {"mensaje": "Estado cambiado correctamente"}, 200