# Archivo: usuarios_service.py
# Este archivo contiene la logica de usuarios.
# Aqui validamos datos antes de guardar, consultar o actualizar usuarios.

from app.models.usuarios_model import (
    registrar_usuario,
    listar_usuarios,
    listar_ciudadanos,
    buscar_usuario_por_id,
    actualizar_usuario,
    inhabilitar_usuario,
    cambiar_estado_usuario
)

from app.common.security import cifrar_contrasena, validar_contrasena_segura


def servicio_registrar_usuario(datos):
    """
    Registra un ciudadano.

    IMPORTANTE:
    Este registro es solo para ciudadanos.

    id_rol:
    1 = Administrador
    2 = Dueno de punto ecologico
    3 = Ciudadano

    Aqui dejamos fijo:
    id_rol = 3
    """

    nombres = datos.get("nombres")
    apellidos = datos.get("apellidos")
    correo = datos.get("correo")
    usuario = datos.get("usuario")
    contrasena = datos.get("contrasena")
    numero_documento = datos.get("numero_documento")
    celular = datos.get("celular")
    foto_perfil = datos.get("foto_perfil", "")
    id_tipo_documento = datos.get("id_tipo_documento")

    # El ciudadano siempre queda activo.
    id_estado = 1

    # El ciudadano siempre queda con rol 3.
    # No dejamos que el frontend decida el rol.
    id_rol = 3

    if not nombres:
        return {"mensaje": "Los nombres son obligatorios"}, 400

    if not apellidos:
        return {"mensaje": "Los apellidos son obligatorios"}, 400

    if not correo:
        return {"mensaje": "El correo es obligatorio"}, 400

    if not usuario:
        return {"mensaje": "El usuario es obligatorio"}, 400

    if len(usuario) < 5:
        return {"mensaje": "El usuario debe tener minimo 5 caracteres"}, 400

    contrasena_segura, mensaje_contrasena = validar_contrasena_segura(contrasena)

    if not contrasena_segura:
        return {"mensaje": mensaje_contrasena}, 400

    if not numero_documento:
        return {"mensaje": "El numero de documento es obligatorio"}, 400

    if not id_tipo_documento:
        return {"mensaje": "El tipo de documento es obligatorio"}, 400

    # Nunca guardamos la contrasena normal.
    # Primero la ciframos.
    contrasena_cifrada = cifrar_contrasena(contrasena)

    registrar_usuario(
        nombres,
        apellidos,
        correo,
        usuario,
        contrasena_cifrada,
        numero_documento,
        celular,
        foto_perfil,
        id_tipo_documento,
        id_rol,
        id_estado
    )

    return {"mensaje": "Ciudadano registrado correctamente"}, 201


def servicio_listar_usuarios():
    """
    Lista todos los usuarios.

    Esta funcion la puede usar el administrador.
    """

    usuarios = listar_usuarios()

    return usuarios, 200


def servicio_listar_ciudadanos():
    """
    Lista solamente ciudadanos.

    id_rol = 3
    """

    ciudadanos = listar_ciudadanos()

    return ciudadanos, 200


def servicio_buscar_usuario(id_usuario):
    """
    Busca un usuario por su ID.
    """

    usuario = buscar_usuario_por_id(id_usuario)

    if usuario is None:
        return {"mensaje": "Usuario no encontrado"}, 404

    return usuario, 200


def servicio_actualizar_usuario(id_usuario, datos):
    """
    Actualiza un usuario.

    Esta funcion se puede usar desde el panel del administrador.
    """

    nombres = datos.get("nombres")
    apellidos = datos.get("apellidos")
    correo = datos.get("correo")
    usuario = datos.get("usuario")
    numero_documento = datos.get("numero_documento")
    celular = datos.get("celular")
    foto_perfil = datos.get("foto_perfil", "")
    id_tipo_documento = datos.get("id_tipo_documento")
    id_rol = datos.get("id_rol")
    id_estado = datos.get("id_estado")

    if not nombres or not apellidos or not correo or not usuario:
        return {"mensaje": "Faltan datos obligatorios"}, 400

    actualizar_usuario(
        id_usuario,
        nombres,
        apellidos,
        correo,
        usuario,
        numero_documento,
        celular,
        foto_perfil,
        id_tipo_documento,
        id_rol,
        id_estado
    )

    return {"mensaje": "Usuario actualizado correctamente"}, 200


def servicio_inhabilitar_usuario(id_usuario):
    """
    Inhabilita un usuario.

    No lo borra de la base de datos.
    Solo cambia su estado a inactivo.
    """

    inhabilitar_usuario(id_usuario)

    return {"mensaje": "Usuario inhabilitado correctamente"}, 200


def servicio_cambiar_estado_usuario(id_usuario, datos):
    """
    Cambia el estado de un usuario desde el panel del administrador.

    Esta funcion no crea usuarios. Solo permite administrar cuentas ya
    registradas por ciudadano o por dueno de recicladora.
    """

    id_estado = datos.get("id_estado")

    if not id_estado:
        return {"mensaje": "El estado es obligatorio"}, 400

    cambiar_estado_usuario(id_usuario, id_estado)

    return {"mensaje": "Estado del usuario actualizado correctamente"}, 200
