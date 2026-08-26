## Archivo: recicladoras_service.py
## Servicio de negocio: valida reglas del sistema antes de llamar a modelos.


import re

from app.common.database import obtener_conexion
from app.models.usuarios_model import registrar_usuario
from app.models.usuarios_model import buscar_usuario_por_correo, buscar_usuario_por_documento, buscar_usuario_por_usuario
from app.models.usuarios_model import buscar_usuario_por_id
from app.models.recicladoras_model import (
    actualizar_perfil_recicladora,
    actualizar_punto_recicladora,
    actualizar_validacion_recicladora,
    asociar_punto_a_recicladora,
    buscar_recicladora_por_nit,
    buscar_recicladora_por_usuario,
    cambiar_estado_punto_recicladora,
    cambiar_estado_registro_recicladora,
    listar_materiales_punto_recicladora,
    listar_novedades_punto_recicladora,
    listar_registros_por_recicladora,
    listar_recicladoras,
    obtener_dashboard_recicladora,
    obtener_estadisticas_recicladora,
    reemplazar_materiales_punto_recicladora,
    responder_novedad_punto_recicladora,
    registrar_recicladora
)
from app.models.ubicaciones_model import crear_ubicacion
from app.models.novedades_model import crear_novedad
from app.models.notificaciones_model import crear_notificacion
from app.common.security import cifrar_contrasena, validar_contrasena_segura


def _correo_valido(correo):
    """Valida un correo con una regla sencilla y entendible."""

    return bool(correo and "@" in correo and "." in correo)


def _texto_limpio(datos, *llaves):
    """
    Lee campos enviados desde formularios distintos y elimina espacios extra.
    Esto evita que una pantalla mande "cedula" y otra "numero_documento".
    """

    for llave in llaves:
        valor = datos.get(llave)
        if valor is not None:
            return str(valor).strip()

    return ""


def _documento_limpio(numero_documento):
    """Convierte el documento en solo numeros antes de validar y guardar."""

    return re.sub(r"\D", "", str(numero_documento or ""))


def _usuario_valido(usuario):
    """Valida minimo 5 caracteres y caracteres seguros para usuario visible."""

    return bool(re.fullmatch(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9._ -]{5,}", str(usuario or "").strip()))


def _texto_desde_lista(valor):
    """
    Convierte listas del formulario en texto guardable.

    Algunos navegadores envian los dias seleccionados como lista. La columna en
    Supabase es texto, por eso se transforma a una frase separada por comas.
    """

    if isinstance(valor, list):
        return ", ".join(str(item).strip() for item in valor if str(item).strip())

    if valor is None:
        return None

    texto = str(valor).strip()
    return texto or None


def _limpiar_registro_recicladora_incompleto(id_usuario, id_punto=None):
    """
    Elimina datos creados a medias cuando falla el registro de una recicladora.

    Asi evitamos que en Supabase aparezca el usuario, pero no aparezca su punto
    ecologico en el administrador.
    """

    if not id_usuario:
        return

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    try:
        if id_punto:
            cursor.execute("DELETE FROM punto_material WHERE id_punto = %s", (id_punto,))

        cursor.execute("DELETE FROM recicladoras WHERE id_usuario = %s", (id_usuario,))

        if id_punto:
            cursor.execute("DELETE FROM puntos_reciclaje WHERE id_punto = %s", (id_punto,))

        cursor.execute("DELETE FROM usuarios WHERE id_usuario = %s", (id_usuario,))
        conexion.commit()
    except Exception:
        conexion.rollback()
    finally:
        cursor.close()
        conexion.close()


def servicio_registrar_dueno_recicladora(datos):
    """
    Registra un dueno de punto ecologico.

    Este registro guarda datos en dos tablas:

    1. usuarios
       Guarda los datos personales.

    2. recicladoras
       Guarda los datos de la empresa o punto ecologico.

    El dueno siempre tendra:
    id_rol = 2
    """

    datos = datos or {}

    correo = _texto_limpio(datos, "correo", "email").lower()
    contrasena = datos.get("contrasena")
    foto_perfil = datos.get("foto_perfil", "")

    nit_empresa = _texto_limpio(datos, "nit_empresa", "nit")
    nombre_empresa = _texto_limpio(datos, "nombre_empresa")
    direccion_empresa = _texto_limpio(datos, "direccion_empresa", "direccion")
    telefono_empresa = _texto_limpio(datos, "telefono_empresa", "telefono")
    camara_comercio = datos.get("camara_comercio", "")
    ids_materiales = datos.get("ids_materiales") or []
    horario = datos.get("horario")
    dias_trabajo = _texto_desde_lista(datos.get("dias_trabajo"))
    hora_inicio = datos.get("hora_inicio")
    hora_fin = datos.get("hora_fin")
    dias_no_trabaja = _texto_desde_lista(datos.get("dias_no_trabaja"))

    if not correo:
        return {"mensaje": "El correo es obligatorio"}, 400

    if not _correo_valido(correo):
        return {"mensaje": "El correo no tiene un formato valido"}, 400

    contrasena_segura, mensaje_contrasena = validar_contrasena_segura(contrasena)

    if not contrasena_segura:
        return {"mensaje": mensaje_contrasena}, 400

    if not nit_empresa:
        return {"mensaje": "El NIT de la empresa es obligatorio"}, 400

    if not nombre_empresa:
        return {"mensaje": "El nombre de la empresa es obligatorio"}, 400

    if not direccion_empresa:
        return {"mensaje": "La direccion de la empresa es obligatoria"}, 400

    usuario = _texto_limpio(datos, "usuario", "nombre_usuario", "username") or nombre_empresa
    nombres = nombre_empresa
    apellidos = "Empresa"
    numero_documento = _documento_limpio(nit_empresa)
    celular = telefono_empresa
    id_tipo_documento = datos.get("id_tipo_documento") or datos.get("tipo_documento") or 1

    if not _usuario_valido(usuario):
        return {"mensaje": "El usuario debe tener minimo 5 caracteres y usar solo letras, numeros, espacios, punto, guion o guion bajo"}, 400

    if not str(nit_empresa).replace("-", "").replace(".", "").isdigit():
        return {"mensaje": "El NIT debe contener solo numeros, puntos o guion"}, 400

    if buscar_usuario_por_usuario(usuario):
        return {"mensaje": "El usuario o correo ya se encuentra registrado"}, 400

    if buscar_usuario_por_correo(correo):
        return {"mensaje": "El correo ya se encuentra registrado"}, 400

    if buscar_usuario_por_documento(numero_documento):
        return {"mensaje": "El NIT ya se encuentra registrado como cuenta de recicladora"}, 400

    if buscar_recicladora_por_nit(nit_empresa):
        return {"mensaje": "El NIT ya pertenece a una recicladora registrada"}, 400

    if not camara_comercio:
        return {"mensaje": "Debes cargar o registrar la camara de comercio"}, 400

    if not isinstance(ids_materiales, list) or not ids_materiales:
        return {"mensaje": "Debes seleccionar al menos un material que recibe la recicladora"}, 400

    try:
        ids_materiales_limpios = [int(id_material) for id_material in ids_materiales]
    except (TypeError, ValueError):
        return {"mensaje": "Los materiales seleccionados no son validos"}, 400

    ids_materiales_limpios = [id_material for id_material in ids_materiales_limpios if id_material > 0]

    if not ids_materiales_limpios:
        return {"mensaje": "Debes seleccionar materiales validos"}, 400

    if not horario and hora_inicio and hora_fin:
        horario = f"{hora_inicio} - {hora_fin}"
    contrasena_cifrada = cifrar_contrasena(contrasena)
    id_rol = 2
    id_estado = 2

    id_usuario_creado = registrar_usuario(
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

    id_punto_creado = None

    try:
        registrar_recicladora(
            id_usuario_creado,
            nit_empresa,
            nombre_empresa,
            direccion_empresa,
            telefono_empresa,
            camara_comercio,
            id_estado,
            {
                "horario": horario or "Horario por confirmar",
                "dias_trabajo": dias_trabajo,
                "hora_inicio": hora_inicio or None,
                "hora_fin": hora_fin or None,
                "dias_no_trabaja": dias_no_trabaja,
                "estado_validacion_nit": "pendiente",
                "estado_camara_comercio": "pendiente",
            },
        )
        id_punto_creado = crear_ubicacion(
            nombre_empresa,
            direccion_empresa,
            horario or "Horario por confirmar",
            datos.get("latitud"),
            datos.get("longitud"),
            telefono_empresa,
            nombre_empresa,
            id_estado
        )
        asociar_punto_a_recicladora(id_usuario_creado, id_punto_creado)
        materiales_guardados = reemplazar_materiales_punto_recicladora(id_usuario_creado, ids_materiales_limpios)

        if not materiales_guardados:
            raise RuntimeError("No se pudieron asociar los materiales al punto ecologico.")

        crear_notificacion(
            "Nueva recicladora registrada",
            f"Se registró la recicladora {nombre_empresa}. Revisa su Cámara de Comercio para activar la cuenta.",
            None,
            1,
        )
    except Exception as error:
        _limpiar_registro_recicladora_incompleto(id_usuario_creado, id_punto_creado)
        print(f"Error completando registro de recicladora: {error}")
        return {"mensaje": "No se pudo completar el registro de la recicladora. Intentalo de nuevo."}, 500

    return {
        "mensaje": "Registro recibido correctamente. La cuenta queda pendiente hasta que el administrador valide la Camara de Comercio.",
        "id_usuario": id_usuario_creado,
        "id_punto": id_punto_creado
    }, 201


def servicio_validar_documento_recicladora(id_usuario, datos):
    estado_camara = str((datos or {}).get("estado_camara_comercio") or "").strip().lower()
    if estado_camara not in ("validado", "rechazado", "pendiente"):
        return {"mensaje": "El estado debe ser validado, rechazado o pendiente"}, 400

    recicladora = actualizar_validacion_recicladora(id_usuario, estado_camara)
    if not recicladora:
        return {"mensaje": "No se encontro una recicladora asociada a este usuario"}, 404

    if estado_camara == "validado":
        crear_notificacion(
            "Recicladora validada",
            f"La recicladora {recicladora.get('nombre_empresa') or ''} fue validada y ya puede operar en GreenUp.",
            id_usuario,
            None,
        )
        crear_notificacion(
            "Nuevo punto ecológico disponible",
            f"Ya puedes consultar en el mapa el punto ecológico de {recicladora.get('nombre_empresa') or 'una recicladora'}.",
            None,
            3,
        )
        return {"mensaje": "Camara de Comercio validada. La cuenta quedo activa.", "estado": estado_camara}, 200

    if estado_camara == "rechazado":
        crear_notificacion(
            "Documento rechazado",
            "Tu Cámara de Comercio fue rechazada. Revisa los datos y comunícate con soporte GreenUp.",
            id_usuario,
            None,
        )
        return {"mensaje": "Camara de Comercio rechazada. La cuenta quedo inactiva.", "estado": estado_camara}, 200

    return {"mensaje": "Validacion devuelta a pendiente. La cuenta quedo inactiva.", "estado": estado_camara}, 200


def servicio_listar_duenos_recicladora():
    """
    Lista todos los duenos de recicladora con sus datos de empresa.
    """

    recicladoras = listar_recicladoras()

    return recicladoras, 200
def servicio_obtener_perfil_recicladora(id_usuario):
    """
    Devuelve los datos personales y empresariales del dueno autenticado.
    """

    recicladora = buscar_recicladora_por_usuario(id_usuario)

    if not recicladora:
        usuario = buscar_usuario_por_id(id_usuario)
        if not usuario or int(usuario.get("id_rol") or 0) != 2:
            return {"mensaje": "No se encontro una recicladora asociada a este usuario"}, 404
        return {
            "id_usuario": usuario.get("id_usuario"),
            "nombres": usuario.get("nombres"),
            "apellidos": usuario.get("apellidos"),
            "correo": usuario.get("correo"),
            "usuario": usuario.get("usuario"),
            "numero_documento": usuario.get("numero_documento"),
            "celular": usuario.get("celular"),
            "fecha_registro": usuario.get("fecha_registro"),
            "id_estado_usuario": usuario.get("id_estado"),
            "id_recicladora": None,
            "nit_empresa": usuario.get("numero_documento") or "",
            "nombre_empresa": usuario.get("nombres") or usuario.get("usuario") or "",
            "direccion_empresa": "",
            "telefono_empresa": usuario.get("celular") or "",
            "camara_comercio": "",
            "horario_recicladora": "Horario por confirmar",
            "estado_validacion_nit": "pendiente",
            "estado_camara_comercio": "pendiente",
            "registro_empresarial_incompleto": True,
        }, 200

    return recicladora, 200
def servicio_dashboard_recicladora(id_usuario):
    """
    Retorna datos reales del tablero para refresco automatico del frontend.
    """

    return obtener_dashboard_recicladora(id_usuario), 200
def servicio_actualizar_perfil_recicladora(id_usuario, datos):
    datos = datos or {}
    usuario_actual = buscar_usuario_por_id(id_usuario)

    if not usuario_actual:
        return {"mensaje": "No se encontro el usuario autenticado"}, 404

    administrador = _texto_limpio(datos, "administrador")
    if administrador and not datos.get("nombres"):
        partes_nombre = administrador.split()
        datos["nombres"] = partes_nombre[0] if partes_nombre else administrador
        datos["apellidos"] = " ".join(partes_nombre[1:]) or "Responsable"

    nuevo_usuario = _texto_limpio(datos, "usuario")
    nuevo_correo = _texto_limpio(datos, "correo").lower()

    if nuevo_usuario:
        if not _usuario_valido(nuevo_usuario):
            return {"mensaje": "El usuario debe tener minimo 5 caracteres y usar solo letras, numeros, espacios, punto, guion o guion bajo"}, 400

        usuario_repetido = buscar_usuario_por_usuario(nuevo_usuario)
        if usuario_repetido and int(usuario_repetido.get("id_usuario") or 0) != int(id_usuario):
            return {"mensaje": "El nombre de usuario ya pertenece a otra cuenta"}, 400

        datos["usuario"] = nuevo_usuario

    if nuevo_correo:
        if not _correo_valido(nuevo_correo):
            return {"mensaje": "El correo no tiene un formato valido"}, 400

        correo_repetido = buscar_usuario_por_correo(nuevo_correo)
        if correo_repetido and int(correo_repetido.get("id_usuario") or 0) != int(id_usuario):
            return {"mensaje": "El correo ya pertenece a otra cuenta"}, 400

        datos["correo"] = nuevo_correo

    telefono_empresa = _texto_limpio(datos, "telefono_empresa", "telefono")
    if telefono_empresa and not datos.get("celular"):
        datos["celular"] = telefono_empresa

    recicladora = buscar_recicladora_por_usuario(id_usuario)
    if not recicladora:
        if int(usuario_actual.get("id_rol") or 0) != 2:
            return {"mensaje": "No se encontro una recicladora asociada a este usuario"}, 404

        nit_empresa = _texto_limpio(datos, "nit_empresa", "nit") or usuario_actual.get("numero_documento") or ""
        nombre_empresa = _texto_limpio(datos, "nombre_empresa") or usuario_actual.get("nombres") or usuario_actual.get("usuario") or "Recicladora pendiente"
        direccion_empresa = _texto_limpio(datos, "direccion_empresa", "direccion") or "Direccion por confirmar"
        telefono_empresa = _texto_limpio(datos, "telefono_empresa", "telefono") or usuario_actual.get("celular") or ""
        camara_comercio = datos.get("camara_comercio", "")

        registrar_recicladora(
            id_usuario,
            nit_empresa,
            nombre_empresa,
            direccion_empresa,
            telefono_empresa,
            camara_comercio,
            2,
            {
                "horario": datos.get("horario") or "Horario por confirmar",
                "estado_validacion_nit": "pendiente",
                "estado_camara_comercio": "pendiente",
            },
        )
        crear_notificacion(
            "Documento de recicladora pendiente",
            f"La recicladora {nombre_empresa} actualizó su Cámara de Comercio. Revisa el documento para activar la cuenta.",
            None,
            1,
        )
        return {"mensaje": "Perfil de recicladora actualizado correctamente"}, 200

    actualizar_perfil_recicladora(id_usuario, datos)
    return {"mensaje": "Perfil de recicladora actualizado correctamente"}, 200
def servicio_obtener_punto_recicladora(id_usuario):
    recicladora = buscar_recicladora_por_usuario(id_usuario)
    if not recicladora:
        return {"mensaje": "No se encontro una recicladora asociada a este usuario"}, 404
    if not recicladora.get("id_punto"):
        return {"mensaje": "Esta recicladora aun no tiene punto ecologico asociado"}, 404
    return recicladora, 200
def servicio_actualizar_punto_recicladora(id_usuario, datos):
    recicladora = buscar_recicladora_por_usuario(id_usuario)
    direccion = datos.get("direccion") or datos.get("direccion_empresa")
    # GreenUP usa Leaflet/OpenStreetMap en frontend. No geocodificamos con servicios externos.
    # Si la interfaz no envia coordenadas, se actualiza la direccion sin inventar lat/lng.

    actualizado = actualizar_punto_recicladora(id_usuario, datos)
    if not actualizado:
        return {"mensaje": "No se encontro el punto ecologico propio de esta recicladora"}, 404

    nombre_empresa = (recicladora or {}).get("nombre_empresa") or "una recicladora"
    nueva_direccion = direccion or (recicladora or {}).get("direccion_empresa") or "la ubicación actualizada"
    crear_notificacion(
        "Punto ecológico actualizado",
        f"{nombre_empresa} actualizó su ubicación. Revisa la nueva dirección: {nueva_direccion}.",
        None,
        1,
    )
    crear_notificacion(
        "Nueva ubicación disponible",
        f"{nombre_empresa} cambió su dirección. Mira la nueva ubicación en el mapa GreenUp.",
        None,
        3,
    )
    return {"mensaje": "Punto ecologico actualizado correctamente"}, 200
def servicio_cambiar_estado_punto_recicladora(id_usuario, datos):
    id_estado = datos.get("id_estado")
    if id_estado not in (1, 2, "1", "2"):
        return {"mensaje": "El estado debe ser 1 activo o 2 inactivo"}, 400

    actualizado = cambiar_estado_punto_recicladora(id_usuario, int(id_estado))
    if not actualizado:
        return {"mensaje": "No se encontro el punto ecologico propio de esta recicladora"}, 404
    return {"mensaje": "Estado del punto actualizado correctamente"}, 200
def servicio_listar_registros_recicladora(id_usuario, fecha_inicio=None, fecha_fin=None):
    return listar_registros_por_recicladora(id_usuario, fecha_inicio, fecha_fin), 200


def servicio_cambiar_estado_registro_recicladora(id_usuario, id_registro, datos):
    """
    Confirma o rechaza una entrega que pertenece al punto de la recicladora.

    Reglas importantes:
    - Solo se puede procesar si esta pendiente.
    - Por ahora no se otorgan puntos ni recompensas.
    - Confirmar o rechazar deja puntos en cero.
    """

    id_estado = datos.get("id_estado")
    if not id_estado:
        return {"mensaje": "El estado es obligatorio"}, 400

    try:
        id_estado = int(id_estado)
    except (TypeError, ValueError):
        return {"mensaje": "El estado debe ser numerico"}, 400

    if id_estado not in (1, 2, 3):
        return {"mensaje": "Estado no permitido"}, 400

    registro = None
    registros_actuales = listar_registros_por_recicladora(id_usuario)
    for item in registros_actuales:
        if int(item.get("id_registro", 0)) == int(id_registro):
            registro = item
            break

    if not registro:
        return {"mensaje": "Registro no encontrado para el punto de esta recicladora"}, 404

    if id_estado not in (2, 3):
        return {"mensaje": "Solo puedes confirmar o rechazar una solicitud pendiente"}, 400

    estado_actual = str(registro.get("estado") or "").strip().lower()
    id_estado_actual = int(registro.get("id_estado") or 0)
    if estado_actual in ("confirmado", "rechazado") or id_estado_actual in (2, 3):
        return {
            "mensaje": "Este reciclaje ya fue procesado y no puede confirmarse otra vez",
            "estado": estado_actual or id_estado_actual,
        }, 409

    motivo_rechazo = datos.get("motivo_rechazo")
    puntos_obtenidos = 0

    if id_estado == 3 and not motivo_rechazo:
        motivo_rechazo = "La recicladora rechazo la entrega durante la validacion."

    actualizado = cambiar_estado_registro_recicladora(
        id_usuario,
        id_registro,
        id_estado,
        puntos_obtenidos,
        motivo_rechazo,
    )
    if not actualizado:
        return {"mensaje": "Registro no encontrado para el punto de esta recicladora o ya procesado"}, 409

    if id_estado == 2:
        crear_notificacion(
            "Reciclaje confirmado",
            f"Tu entrega de {registro.get('material') or 'material reciclable'} fue confirmada. Ya cuenta en tu historial de material recuperado.",
            registro.get("id_usuario"),
            None,
        )
        crear_notificacion(
            "Reciclaje confirmado en punto",
            "Una recicladora confirmo una nueva entrega registrada por un ciudadano.",
            None,
            1,
        )
        return {"mensaje": "Registro confirmado correctamente", "estado": "confirmado"}, 200

    if id_estado == 3:
        crear_notificacion(
            "Reciclaje rechazado",
            f"Tu entrega fue rechazada. Motivo: {motivo_rechazo or 'Sin observaciones adicionales'}.",
            registro.get("id_usuario"),
            None,
        )
        crear_notificacion(
            "Reciclaje rechazado en punto",
            "Una recicladora rechazo una entrega ciudadana y el historial ya fue actualizado.",
            None,
            1,
        )
        return {"mensaje": "Registro rechazado correctamente", "estado": "rechazado"}, 200

    return {"mensaje": "Estado del registro actualizado correctamente"}, 200
def servicio_listar_materiales_recicladora(id_usuario):
    return listar_materiales_punto_recicladora(id_usuario), 200
def servicio_actualizar_materiales_recicladora(id_usuario, datos):
    ids_materiales = datos.get("ids_materiales", [])
    if not isinstance(ids_materiales, list):
        return {"mensaje": "ids_materiales debe ser una lista"}, 400

    actualizado = reemplazar_materiales_punto_recicladora(id_usuario, ids_materiales)
    if not actualizado:
        return {"mensaje": "No se encontro el punto ecologico propio de esta recicladora"}, 404
    return {"mensaje": "Materiales aceptados actualizados correctamente"}, 200
def servicio_listar_novedades_recicladora(id_usuario):
    return listar_novedades_punto_recicladora(id_usuario), 200
def servicio_crear_novedad_recicladora(id_usuario, datos):
    recicladora = buscar_recicladora_por_usuario(id_usuario)
    if not recicladora:
        return {"mensaje": "No se encontro una recicladora asociada a este usuario"}, 404

    titulo = datos.get("titulo") or datos.get("motivo")
    descripcion = datos.get("descripcion") or datos.get("comentario")

    if not titulo:
        return {"mensaje": "El titulo de la novedad es obligatorio"}, 400

    crear_novedad(
        titulo,
        descripcion,
        datos.get("imagen"),
        id_usuario,
        recicladora.get("id_punto"),
        datos.get("motivo") or titulo,
        datos.get("comentario") or descripcion,
        datos.get("ubicacion") or recicladora.get("direccion_punto") or recicladora.get("direccion_empresa"),
    )
    crear_notificacion(
        "Nueva publicación de recicladora",
        f"{recicladora.get('nombre_empresa') or 'Una recicladora'} publicó una novedad visible en GreenUp.",
        None,
        1,
    )
    crear_notificacion(
        "Nueva publicación ambiental",
        "Una recicladora compartió una novedad. Revísala en GreenUp.",
        None,
        3,
    )
    return {"mensaje": "Novedad registrada correctamente"}, 201
def servicio_responder_novedad_recicladora(id_usuario, id_novedad, datos):
    actualizado = responder_novedad_punto_recicladora(id_usuario, id_novedad, datos)
    if not actualizado:
        return {"mensaje": "Novedad no encontrada para el punto de esta recicladora"}, 404
    return {"mensaje": "Novedad actualizada correctamente"}, 200
def servicio_estadisticas_recicladora(id_usuario, fecha_inicio=None, fecha_fin=None):
    return obtener_estadisticas_recicladora(id_usuario, fecha_inicio, fecha_fin), 200
