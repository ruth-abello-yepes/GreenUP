from app.models.usuarios_model import buscar_usuario_por_usuario
from app.common.security import verificar_contrasena


def servicio_login(datos):
    usuario = datos.get("usuario")
    contrasena = datos.get("contrasena")

    if not usuario or not contrasena:
        return {"mensaje": "Usuario y contrasena son obligatorios"}, 400

    usuario_encontrado = buscar_usuario_por_usuario(usuario)

    if usuario_encontrado is None:
        return {"mensaje": "Usuario no encontrado"}, 404

    if usuario_encontrado["id_estado"] != 1:
        return {"mensaje": "Usuario inactivo"}, 403

    contrasena_correcta = verificar_contrasena(
        contrasena,
        usuario_encontrado["contrasena"]
    )

    if not contrasena_correcta:
        return {"mensaje": "Contrasena incorrecta"}, 401

    return {
        "mensaje": "Inicio de sesion correcto",
        "usuario": {
            "id_usuario": usuario_encontrado["id_usuario"],
            "nombres": usuario_encontrado["nombres"],
            "apellidos": usuario_encontrado["apellidos"],
            "usuario": usuario_encontrado["usuario"],
            "id_rol": usuario_encontrado["id_rol"]
        }
    }, 200
