## Servicio de negocio: valida reglas del sistema antes de llamar a modelos.

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
import secrets
import signal
import smtplib
import ssl
from contextlib import contextmanager
from datetime import datetime, timedelta
from email.message import EmailMessage
from flask import current_app
import jwt
import requests
from app.common.jwt_config import JWT_ALGORITHM, obtener_jwt_secret

from app.models.usuarios_model import (
    buscar_usuario_por_usuario,
    buscar_usuario_por_correo,
    guardar_codigo_recuperacion_db,
    obtener_codigo_recuperacion_db,
    actualizar_contrasena_db
)
from app.common.security import (
    validar_contrasena_segura,
    verificar_contrasena,
    cifrar_contrasena
)


INTENTOS_LOGIN = {}
INTENTOS_RECUPERACION = {}
SOLICITUDES_RECUPERACION = {}
SEGUNDOS_EXPIRACION_RECUPERACION = 300
SMTP_TIMEOUT_MAXIMO_SEGUNDOS = 8


def _variable_activa(nombre):
    return (os.getenv(nombre) or "").strip().lower() in ("1", "true", "si", "yes", "on")


def _enviar_codigo_por_apps_script(destinatario, asunto, texto, html):
    url = (os.getenv("APPS_SCRIPT_URL") or "").strip()
    secreto = (os.getenv("APPS_SCRIPT_SECRET") or "").strip()

    if not url:
        raise RuntimeError("APPS_SCRIPT_URL no esta configurada")
    if not secreto:
        raise RuntimeError("APPS_SCRIPT_SECRET no esta configurada correctamente")

    respuesta = requests.post(
        url,
        json={
            "secret": secreto,
            "to": destinatario,
            "subject": asunto,
            "text": texto,
            "html": html,
        },
        timeout=15,
    )

    if respuesta.status_code >= 400:
        detalle = respuesta.text[:180].replace("\n", " ").strip()
        raise RuntimeError(
            f"Apps Script respondio HTTP {respuesta.status_code}"
            + (f": {detalle}" if detalle else "")
        )

    try:
        resultado = respuesta.json()
    except ValueError as error:
        raise RuntimeError("Apps Script no devolvio una respuesta JSON valida") from error

    if resultado.get("estado") != "ok":
        raise RuntimeError(resultado.get("mensaje") or "Apps Script no pudo enviar el correo")


def _enviar_codigo_por_smtp(destinatario, asunto, texto, html):
    remitente = current_app.config.get("MAIL_DEFAULT_SENDER") or current_app.config.get("MAIL_USERNAME")
    servidor = current_app.config.get("MAIL_SERVER") or "smtp.gmail.com"
    puerto = int(current_app.config.get("MAIL_PORT") or 587)
    usuario = current_app.config.get("MAIL_USERNAME")
    password = (current_app.config.get("MAIL_PASSWORD") or "").replace(" ", "")
    timeout = min(int(current_app.config.get("MAIL_TIMEOUT") or SMTP_TIMEOUT_MAXIMO_SEGUNDOS), SMTP_TIMEOUT_MAXIMO_SEGUNDOS)

    mensaje = EmailMessage()
    mensaje["Subject"] = asunto
    mensaje["From"] = remitente
    mensaje["To"] = destinatario
    mensaje.set_content(texto)
    mensaje.add_alternative(html, subtype="html")

    if current_app.config.get("MAIL_USE_SSL") or puerto == 465:
        contexto = ssl.create_default_context()
        with smtplib.SMTP_SSL(servidor, puerto, timeout=timeout, context=contexto) as smtp:
            smtp.login(usuario, password)
            smtp.send_message(mensaje)
        return

    with smtplib.SMTP(servidor, puerto, timeout=timeout) as smtp:
        smtp.ehlo()
        if current_app.config.get("MAIL_USE_TLS"):
            smtp.starttls(context=ssl.create_default_context())
            smtp.ehlo()
        smtp.login(usuario, password)
        smtp.send_message(mensaje)


def _enviar_codigo_por_brevo(destinatario, asunto, html):
    api_key = (os.getenv("BREVO_API_KEY") or "").strip()
    if not api_key:
        raise RuntimeError("BREVO_API_KEY no configurada")

    remitente = (
        current_app.config.get("MAIL_DEFAULT_SENDER")
        or current_app.config.get("MAIL_USERNAME")
        or "greenup213@gmail.com"
    )

    respuesta = requests.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={
            "api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        json={
            "sender": {"name": "GreenUP", "email": remitente},
            "to": [{"email": destinatario}],
            "subject": asunto,
            "htmlContent": html
        },
        timeout=10,
    )

    if respuesta.status_code >= 400:
        raise RuntimeError(respuesta.text[:180])


def _enviar_codigo_por_resend(destinatario, asunto, texto, html):
    api_key = (os.getenv("RESEND_API_KEY") or "").strip()
    if not api_key:
        raise RuntimeError("RESEND_API_KEY no configurada")

    remitente = (
        os.getenv("RESEND_FROM_EMAIL")
        or "GreenUP <onboarding@resend.dev>"
    )
    responder_a = (
        os.getenv("RESEND_REPLY_TO")
        or current_app.config.get("MAIL_DEFAULT_SENDER")
        or current_app.config.get("MAIL_USERNAME")
        or "greenup213@gmail.com"
    )
    respuesta = requests.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "from": remitente,
            "to": [destinatario],
            "subject": asunto,
            "text": texto,
            "html": html,
            "reply_to": responder_a,
        },
        timeout=10,
    )

    if respuesta.status_code >= 400:
        raise RuntimeError(respuesta.text[:180])


def _crear_token(usuario):
    payload = {
        "id_usuario": usuario["id_usuario"],
        "id_rol": usuario["id_rol"],
        "usuario": usuario["usuario"],
        "exp": datetime.utcnow() + timedelta(hours=8),
    }
    return jwt.encode(payload, obtener_jwt_secret(), algorithm=JWT_ALGORITHM)


def _login_bloqueado(usuario):
    registro = INTENTOS_LOGIN.get(usuario)
    if not registro:
        return False
    if registro["intentos"] < 5:
        return False
    return datetime.now() < registro["bloqueado_hasta"]


def _registrar_fallo_login(usuario):
    registro = INTENTOS_LOGIN.get(usuario, {"intentos": 0, "bloqueado_hasta": datetime.now()})
    registro["intentos"] += 1
    if registro["intentos"] >= 5:
        registro["bloqueado_hasta"] = datetime.now() + timedelta(minutes=10)
    INTENTOS_LOGIN[usuario] = registro


def _limpiar_intentos_login(usuario):
    INTENTOS_LOGIN.pop(usuario, None)


def servicio_login(datos):
    """
    Login normal para dueno de punto ecologico y ciudadano.
    """
    usuario = (datos.get("usuario") or datos.get("correo") or datos.get("email") or "").strip()
    contrasena = datos.get("contrasena") or datos.get("password")

    if not usuario or not contrasena:
        return {"mensaje": "Usuario y contrasena son obligatorios"}, 400

    if _login_bloqueado(usuario):
        return {"mensaje": "Demasiados intentos fallidos. Intenta nuevamente en 10 minutos"}, 429

    usuario_encontrado = buscar_usuario_por_usuario(usuario)

    if usuario_encontrado is None:
        _registrar_fallo_login(usuario)
        return {"mensaje": "Credenciales incorrectas"}, 401

    es_recicladora_pendiente = int(usuario_encontrado.get("id_rol") or 0) == 2 and int(usuario_encontrado.get("id_estado") or 0) == 2
    if usuario_encontrado["id_estado"] != 1 and not es_recicladora_pendiente:
        return {"mensaje": "Usuario inactivo"}, 403

    contrasena_correcta = verificar_contrasena(
        contrasena,
        usuario_encontrado["contrasena"]
    )

    if not contrasena_correcta:
        _registrar_fallo_login(usuario)
        return {"mensaje": "Credenciales incorrectas"}, 401

    if usuario_encontrado["id_rol"] == 1:
        return {"mensaje": "El administrador debe usar el login de administrador"}, 403

    _limpiar_intentos_login(usuario)
    token = _crear_token(usuario_encontrado)

    return {
        "mensaje": "Inicio de sesion correcto",
        "token": token,
        "usuario": {
            "id_usuario": usuario_encontrado["id_usuario"],
            "nombres": usuario_encontrado["nombres"],
            "apellidos": usuario_encontrado["apellidos"],
            "usuario": usuario_encontrado["usuario"],
            "id_rol": usuario_encontrado["id_rol"],
            "foto_perfil": usuario_encontrado.get("foto_perfil")
        }
    }, 200


def servicio_login_admin(datos):
    """
    Login exclusivo del administrador.
    """
    usuario = (datos.get("usuario") or "").strip()
    contrasena = (datos.get("contrasena") or "").strip()
    codigo_admin = (datos.get("codigo_admin") or "").strip()

    if not usuario or not contrasena or not codigo_admin:
        return {"mensaje": "Usuario, contrasena y codigo admin son obligatorios"}, 400

    if _login_bloqueado(usuario):
        return {"mensaje": "Demasiados intentos fallidos. Intenta nuevamente en 10 minutos"}, 429

    codigo_correcto = (os.getenv("ADMIN_ACCESS_CODE") or "").strip()

    if codigo_admin != codigo_correcto:
        _registrar_fallo_login(usuario)
        return {"mensaje": "Codigo admin incorrecto"}, 401

    usuario_encontrado = buscar_usuario_por_usuario(usuario)

    if usuario_encontrado is None:
        _registrar_fallo_login(usuario)
        return {"mensaje": "Credenciales administrativas incorrectas"}, 401

    if usuario_encontrado["id_estado"] != 1:
        return {"mensaje": "Administrador inactivo"}, 403

    if usuario_encontrado["id_rol"] != 1:
        return {"mensaje": "No tienes permisos de administrador"}, 403

    contrasena_correcta = verificar_contrasena(
        contrasena,
        usuario_encontrado["contrasena"]
    )

    if not contrasena_correcta:
        _registrar_fallo_login(usuario)
        return {"mensaje": "Credenciales administrativas incorrectas"}, 401

    _limpiar_intentos_login(usuario)
    token = _crear_token(usuario_encontrado)

    return {
        "mensaje": "Inicio de sesion administrador correcto",
        "token": token,
        "usuario": {
            "id_usuario": usuario_encontrado["id_usuario"],
            "nombres": usuario_encontrado["nombres"],
            "apellidos": usuario_encontrado["apellidos"],
            "usuario": usuario_encontrado["usuario"],
            "id_rol": usuario_encontrado["id_rol"],
            "foto_perfil": usuario_encontrado.get("foto_perfil")
        }
    }, 200


def solicitar_codigo_recuperacion(datos):
    correo = (datos.get("correo") or "").strip().lower()

    if not correo:
        return {"mensaje": "El correo electronico es obligatorio"}, 400

    ahora = datetime.now()
    ultima_solicitud = SOLICITUDES_RECUPERACION.get(correo)
    if ultima_solicitud and (ahora - ultima_solicitud).total_seconds() < 60:
        return {
            "mensaje": "Si el correo esta registrado, recibiras un codigo en breve.",
            "enviado": True,
            "expira_en_segundos": SEGUNDOS_EXPIRACION_RECUPERACION,
        }, 200
    SOLICITUDES_RECUPERACION[correo] = ahora

    usuario = buscar_usuario_por_correo(correo)

    if not usuario:
        return {
            "mensaje": "Si el correo esta registrado, recibiras un codigo en breve.",
            "enviado": True,
            "expira_en_segundos": SEGUNDOS_EXPIRACION_RECUPERACION,
        }, 200

    apps_script_url = (os.getenv("APPS_SCRIPT_URL") or "").strip()
    usa_apps_script = bool(apps_script_url)
    apps_script_incompleto = False  # Permitir conexion simple
    usa_brevo = bool((os.getenv("BREVO_API_KEY") or "").strip())
    usa_resend = bool((os.getenv("RESEND_API_KEY") or "").strip())
    usa_smtp = bool(current_app.config.get("MAIL_USERNAME") and current_app.config.get("MAIL_PASSWORD"))

    try:
        codigo = str(secrets.randbelow(900000) + 100000)
        expiracion = datetime.now() + timedelta(seconds=SEGUNDOS_EXPIRACION_RECUPERACION)
        guardar_codigo_recuperacion_db(usuario["id_usuario"], codigo, expiracion)
    except Exception as error:
        print(f"Error guardando codigo de recuperacion: {error}")
        return {"mensaje": "No se pudo generar el codigo de recuperacion."}, 500

    if not usa_apps_script and not usa_brevo and not usa_resend and not usa_smtp:
        if _variable_activa("EMAIL_DEBUG_CODES"):
            print(f"Codigo de recuperacion de desarrollo para {correo}: {codigo}", flush=True)
            return {
                "mensaje": "Codigo generado en modo de desarrollo. Revisa la consola local.",
                "enviado": True,
                "expira_en_segundos": SEGUNDOS_EXPIRACION_RECUPERACION
            }, 200
        return {
            "mensaje": "El servicio de correo no esta configurado.",
            "enviado": False,
            "expira_en_segundos": SEGUNDOS_EXPIRACION_RECUPERACION
        }, 503

    nombre_usuario = usuario.get("usuario") or usuario.get("nombres") or "usuario"
    asunto = "Codigo para restablecer tu contrasena - GreenUP"
    texto = (
        f"Sr(a) {nombre_usuario},\n\n"
        "Recibimos una solicitud para restablecer la contrasena de tu cuenta GreenUP.\n\n"
        f"Tu codigo de verificacion es: {codigo}\n\n"
        "Tienes 5 minutos para ingresar este codigo. Si no solicitaste este cambio, puedes ignorar este correo.\n\n"
        "Equipo GreenUP"
    )
    html = f"""
    <div style="font-family:Arial,sans-serif;color:#102033;line-height:1.5">
      <h2 style="color:#003d6c;margin-bottom:8px">Restablecer contrasena GreenUP</h2>
      <p>Sr(a) <strong>{nombre_usuario}</strong>, recibimos una solicitud para restablecer la contrasena de tu cuenta.</p>
      <p style="margin:20px 0 8px">Tu codigo de verificacion es:</p>
      <p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#296c1f;margin:0">{codigo}</p>
      <p style="margin-top:20px">Tienes <strong>5 minutos</strong> para ingresar este codigo.</p>
      <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
      <p style="color:#607080">Equipo GreenUP</p>
    </div>
    """
    try:
        if usa_apps_script:
            _enviar_codigo_por_apps_script(correo, asunto, texto, html)
        elif usa_brevo:
            _enviar_codigo_por_brevo(correo, asunto, html)
        elif usa_resend:
            _enviar_codigo_por_resend(correo, asunto, texto, html)
        else:
            _enviar_codigo_por_smtp(correo, asunto, texto, html)
    except Exception as error:
        print(f"Error enviando correo de recuperacion GreenUP: {error}")
        return {
            "mensaje": "No se pudo enviar el codigo por correo. Intenta nuevamente.",
            "enviado": False,
            "expira_en_segundos": SEGUNDOS_EXPIRACION_RECUPERACION
        }, 502

    return {
        "mensaje": "Codigo enviado correctamente. Revisa tu correo electronico.",
        "enviado": True,
        "expira_en_segundos": SEGUNDOS_EXPIRACION_RECUPERACION
    }, 200


def restablecer_contrasena(datos):
    correo = datos.get("correo")
    codigo = datos.get("codigo")
    nueva_contrasena = datos.get("nueva_contrasena")

    if not correo or not codigo or not nueva_contrasena:
        return {"mensaje": "Correo, codigo y nueva contrasena son obligatorios"}, 400

    contrasena_segura, mensaje_contrasena = validar_contrasena_segura(nueva_contrasena)
    if not contrasena_segura:
        return {"mensaje": mensaje_contrasena}, 400

    usuario = buscar_usuario_por_correo(correo)

    if not usuario:
        return {"mensaje": "Codigo invalido o expirado"}, 400

    clave_intentos = str(usuario["id_usuario"])
    if INTENTOS_RECUPERACION.get(clave_intentos, 0) >= 5:
        return {"mensaje": "Demasiados intentos. Solicita un codigo nuevo."}, 429

    registro_codigo = obtener_codigo_recuperacion_db(usuario["id_usuario"], codigo)

    if not registro_codigo:
        INTENTOS_RECUPERACION[clave_intentos] = INTENTOS_RECUPERACION.get(clave_intentos, 0) + 1
        return {"mensaje": "Codigo invalido o expirado"}, 400

    if datetime.now() > registro_codigo["expiracion"]:
        return {"mensaje": "El codigo ha expirado. Solicita uno nuevo."}, 400

    contrasena_hash = cifrar_contrasena(nueva_contrasena)
    actualizar_contrasena_db(usuario["id_usuario"], contrasena_hash)
    INTENTOS_RECUPERACION.clear()

    return {"mensaje": "Contrasena actualizada exitosamente. Ya puedes iniciar sesion."}, 200


def verificar_codigo_recuperacion(datos):
    correo = datos.get("correo")
    codigo = datos.get("codigo")

    if not correo or not codigo:
        return {"mensaje": "Correo y codigo son obligatorios"}, 400

    usuario = buscar_usuario_por_correo(correo)

    if not usuario:
        return {"mensaje": "Codigo invalido o expirado"}, 400

    clave_intentos = str(usuario["id_usuario"])
    if INTENTOS_RECUPERACION.get(clave_intentos, 0) >= 5:
        return {"mensaje": "Demasiados intentos. Solicita un codigo nuevo."}, 429

    registro_codigo = obtener_codigo_recuperacion_db(usuario["id_usuario"], codigo)

    if not registro_codigo:
        INTENTOS_RECUPERACION[clave_intentos] = INTENTOS_RECUPERACION.get(clave_intentos, 0) + 1
        return {"mensaje": "Codigo invalido o expirado"}, 400

    if datetime.now() > registro_codigo["expiracion"]:
        return {"mensaje": "El codigo ha expirado. Solicita uno nuevo."}, 400

    return {"mensaje": "Codigo verificado correctamente"}, 200


def cambiar_contrasena_desde_perfil(id_usuario, datos):
    contrasena_actual = datos.get("contrasena_actual")
    nueva_contrasena = datos.get("nueva_contrasena")

    if not contrasena_actual or not nueva_contrasena:
        return {"mensaje": "Contrasena actual y nueva contrasena son obligatorias"}, 400

    usuario = None
    from app.models.usuarios_model import buscar_usuario_por_id
    usuario = buscar_usuario_por_id(id_usuario)

    if not usuario:
        return {"mensaje": "Usuario no encontrado"}, 404

    if not verificar_contrasena(contrasena_actual, usuario["contrasena"]):
        return {"mensaje": "La contrasena actual no es correcta"}, 401

    contrasena_segura, mensaje_contrasena = validar_contrasena_segura(nueva_contrasena)
    if not contrasena_segura:
        return {"mensaje": mensaje_contrasena}, 400

    actualizar_contrasena_db(id_usuario, cifrar_contrasena(nueva_contrasena))
    return {"mensaje": "Contrasena actualizada correctamente"}, 200
