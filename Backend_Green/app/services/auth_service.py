"""
Archivo: auth_service.py

Aqui va la logica del inicio de sesion.

Tenemos dos tipos de login:

1. servicio_login()
   Para ciudadano y dueno de punto ecologico.

2. servicio_login_admin()
   Solo para administrador del sistema.

Roles:
1 = Administrador
2 = Dueno de punto ecologico
3 = Ciudadano
"""

import os

from app.models.usuarios_model import buscar_usuario_por_usuario
from app.common.security import verificar_contrasena


def servicio_login(datos):
    """
    Login normal.

    Este login solo permite entrar a:
    - Dueno de punto ecologico
    - Ciudadano

    El administrador NO entra por aqui.
    """

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

    if usuario_encontrado["id_rol"] == 1:
        return {"mensaje": "El administrador debe usar el login de administrador"}, 403

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


def servicio_login_admin(datos):
    """
    Login exclusivo del administrador.

    Pide:
    - usuario
    - contrasena
    - codigo_admin

    El codigo_admin se guarda en el archivo .env.
    """

    usuario = datos.get("usuario")
    contrasena = datos.get("contrasena")
    codigo_admin = datos.get("codigo_admin")

    if not usuario or not contrasena or not codigo_admin:
        return {"mensaje": "Usuario, contrasena y codigo admin son obligatorios"}, 400

    usuario_encontrado = buscar_usuario_por_usuario(usuario)

    if usuario_encontrado is None:
        return {"mensaje": "Administrador no encontrado"}, 404

    if usuario_encontrado["id_estado"] != 1:
        return {"mensaje": "Administrador inactivo"}, 403

    if usuario_encontrado["id_rol"] != 1:
        return {"mensaje": "No tienes permisos de administrador"}, 403

    contrasena_correcta = verificar_contrasena(
        contrasena,
        usuario_encontrado["contrasena"]
    )

    if not contrasena_correcta:
        return {"mensaje": "Contrasena incorrecta"}, 401

    codigo_correcto = os.getenv("ADMIN_ACCESS_CODE")

    if codigo_admin != codigo_correcto:
        return {"mensaje": "Codigo admin incorrecto"}, 401

    return {
        "mensaje": "Inicio de sesion administrador correcto",
        "usuario": {
            "id_usuario": usuario_encontrado["id_usuario"],
            "nombres": usuario_encontrado["nombres"],
            "apellidos": usuario_encontrado["apellidos"],
            "usuario": usuario_encontrado["usuario"],
            "id_rol": usuario_encontrado["id_rol"]
        }
    }, 200