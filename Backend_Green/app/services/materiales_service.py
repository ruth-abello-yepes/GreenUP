# Servicio de materiales
# Aquí se validan los datos antes de llamar al modelo.

from app.models.materiales_model import (
    crear_material,
    listar_materiales,
    buscar_material,
    editar_material,
    cambiar_estado
)


def servicio_crear_material(data):
    """
    Valida y crea un material.
    """
    nombre = data.get("nombre")
    descripcion = data.get("descripcion")
    unidad = data.get("unidad", "kg")
    puntos_por_kg = data.get("puntos_por_kg", 0)
    id_tipo_residuo = data.get("id_tipo_residuo")

    if not nombre:
        return {"mensaje": "El nombre es obligatorio"}, 400

    crear_material(nombre, descripcion, unidad, puntos_por_kg, id_tipo_residuo)

    return {"mensaje": "Material creado correctamente"}, 201


def servicio_listar_materiales():
    """
    Retorna todos los materiales.
    """
    materiales = listar_materiales()
    return materiales, 200


def servicio_buscar_material(id_material):
    """
    Busca un material por ID.
    """
    material = buscar_material(id_material)

    if not material:
        return {"mensaje": "Material no encontrado"}, 404

    return material, 200


def servicio_editar_material(id_material, data):
    """
    Valida y edita un material.
    """
    material = buscar_material(id_material)

    if not material:
        return {"mensaje": "Material no encontrado"}, 404

    nombre = data.get("nombre")
    descripcion = data.get("descripcion")
    unidad = data.get("unidad", "kg")
    puntos_por_kg = data.get("puntos_por_kg", 0)
    id_tipo_residuo = data.get("id_tipo_residuo")

    if not nombre:
        return {"mensaje": "El nombre es obligatorio"}, 400

    editar_material(
        id_material,
        nombre,
        descripcion,
        unidad,
        puntos_por_kg,
        id_tipo_residuo
    )

    return {"mensaje": "Material editado correctamente"}, 200


def servicio_cambiar_estado(id_material, data):
    """
    Cambia el estado del material.
    """
    material = buscar_material(id_material)

    if not material:
        return {"mensaje": "Material no encontrado"}, 404

    id_estado = data.get("id_estado")

    if not id_estado:
        return {"mensaje": "El estado es obligatorio"}, 400

    cambiar_estado(id_material, id_estado)

    return {"mensaje": "Estado cambiado correctamente"}, 200
