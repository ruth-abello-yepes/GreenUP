## Archivo: roles_service.py
## Servicio de negocio: valida reglas del sistema antes de llamar a modelos.

from app.models.roles_model import registrar_rol, listar_roles, buscar_rol_por_id, actualizar_rol, inhabilitar_rol


def servicio_registrar_rol(datos):
    nombre = datos.get("nombre")
    descripcion = datos.get("descripcion")
    id_estado = 1

    if not nombre:
        return {"mensaje": "El nombre del rol es obligatorio"}, 400

    registrar_rol(nombre, descripcion, id_estado)

    return {"mensaje": "Rol registrado correctamente"}, 201


def servicio_listar_roles():
    roles = listar_roles()

    return roles, 200


def servicio_buscar_rol(id_rol):
    rol = buscar_rol_por_id(id_rol)

    if rol is None:
        return {"mensaje": "Rol no encontrado"}, 404

    return rol, 200


def servicio_actualizar_rol(id_rol, datos):
    if int(id_rol) == 1:
        return {"mensaje": "El rol Administrador no puede modificarse desde el panel"}, 403

    nombre = datos.get("nombre")
    descripcion = datos.get("descripcion")
    id_estado = datos.get("id_estado")

    if not nombre:
        return {"mensaje": "El nombre del rol es obligatorio"}, 400

    actualizar_rol(id_rol, nombre, descripcion, id_estado)

    return {"mensaje": "Rol actualizado correctamente"}, 200


def servicio_inhabilitar_rol(id_rol):
    if int(id_rol) == 1:
        return {"mensaje": "El rol Administrador no puede inhabilitarse"}, 403

    inhabilitar_rol(id_rol)

    return {"mensaje": "Rol inhabilitado correctamente"}, 200
