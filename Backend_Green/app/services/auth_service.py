"""
Archivo: auth_service.py

Aqui va la logica del inicio de sesion y recuperacion de contraseña.

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
import random
from datetime import datetime, timedelta
from flask_mail import Message

from app.models.usuarios_model import (
    buscar_usuario_por_usuario,
    buscar_usuario_por_correo,
    guardar_codigo_recuperacion_db,
    obtener_codigo_recuperacion_db,
    actualizar_contrasena_db
)
from app.common.security import verificar_contrasena, cifrar_contrasena


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


def solicitar_codigo_recuperacion(datos):
    correo = datos.get("correo")

    if not correo:
        return {"mensaje": "El correo electronico es obligatorio"}, 400

    usuario = buscar_usuario_por_correo(correo)

    if not usuario:
        return {"mensaje": "Si el correo esta registrado, se ha enviado un codigo de verificacion."}, 200

    codigo = str(random.randint(100000, 999999))
    expiracion = datetime.now() + timedelta(minutes=15)

    guardar_codigo_recuperacion_db(usuario["id_usuario"], codigo, expiracion)

    try:
        from app import mail

        msg = Message(
            subject="Codigo de Recuperacion de Contrasena - GreenUP",
            recipients=[correo]
        )
        msg.body = f"Hola {usuario['nombres']},\n\nTu codigo de verificacion es: {codigo}\n\nEste codigo expira en 15 minutos."
        mail.send(msg)
        return {"mensaje": "Si el correo esta registrado, se ha enviado un codigo de verificacion."}, 200

    except Exception as e:
        print(f"Error enviando correo: {e}")
        return {"mensaje": "Error al enviar el correo electronico. Intente mas tarde."}, 500


def restablecer_contrasena(datos):
    correo = datos.get("correo")
    codigo = datos.get("codigo")
    nueva_contrasena = datos.get("nueva_contrasena")

    if not correo or not codigo or not nueva_contrasena:
        return {"mensaje": "Correo, codigo y nueva contrasena son obligatorios"}, 400

    usuario = buscar_usuario_por_correo(correo)

    if not usuario:
        return {"mensaje": "Codigo invalido o expirado"}, 400

    registro_codigo = obtener_codigo_recuperacion_db(usuario["id_usuario"], codigo)

    if not registro_codigo:
        return {"mensaje": "Codigo invalido o incorrecto"}, 400

    if datetime.now() > registro_codigo["expiracion"]:
        return {"mensaje": "El codigo ha expirado. Solicita uno nuevo."}, 400

    contrasena_hash = cifrar_contrasena(nueva_contrasena)
    actualizar_contrasena_db(usuario["id_usuario"], contrasena_hash)

    return {"mensaje": "Contrasena actualizada exitosamente. Ya puedes iniciar sesion."}, 200