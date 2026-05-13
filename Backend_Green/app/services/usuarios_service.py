from app.models.usuarios_model import registrar_usuario, listar_usuarios, buscar_usuario_por_id, actualizar_usuario, inhabilitar_usuario
from app.common.security import cifrar_contrasena


def servicio_registrar_usuario(datos):
    nombres = datos.get("nombres")
    apellidos = datos.get("apellidos")
    correo = datos.get("correo")
    usuario = datos.get("usuario")
    contrasena = datos.get("contrasena")
    numero_documento = datos.get("numero_documento")
    celular = datos.get("celular")
    foto_perfil = datos.get("foto_perfil")
    id_tipo_documento = datos.get("id_tipo_documento")
    id_rol = datos.get("id_rol")
    id_estado = 1

    if not nombres or not apellidos or not correo or not usuario or not contrasena or not numero_documento:
        return {"mensaje": "Faltan datos obligatorios"}, 400

    if len(usuario) < 5:
        return {"mensaje": "El usuario debe tener minimo 5 caracteres"}, 400

    if len(contrasena) < 8:
        return {"mensaje": "La contrasena debe tener minimo 8 caracteres"}, 400

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

    return {"mensaje": "Usuario registrado correctamente"}, 201


def servicio_listar_usuarios():
    usuarios = listar_usuarios()
    return usuarios, 200


def servicio_buscar_usuario(id_usuario):
    usuario = buscar_usuario_por_id(id_usuario)

    if usuario is None:
        return {"mensaje": "Usuario no encontrado"}, 404

    return usuario, 200


def servicio_actualizar_usuario(id_usuario, datos):
    nombres = datos.get("nombres")
    apellidos = datos.get("apellidos")
    correo = datos.get("correo")
    usuario = datos.get("usuario")
    numero_documento = datos.get("numero_documento")
    celular = datos.get("celular")
    foto_perfil = datos.get("foto_perfil")
    id_tipo_documento = datos.get("id_tipo_documento")
    id_rol = datos.get("id_rol")
    id_estado = datos.get("id_estado")

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
    inhabilitar_usuario(id_usuario)
    return {"mensaje": "Usuario inhabilitado correctamente"}, 200
