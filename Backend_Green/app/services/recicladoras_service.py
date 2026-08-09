## Archivo: recicladoras_service.py
## Servicio de negocio: valida reglas del sistema antes de llamar a modelos.


import os

import googlemaps

from app.models.usuarios_model import registrar_usuario
from app.models.recicladoras_model import (
    actualizar_perfil_recicladora,
    actualizar_punto_recicladora,
    asociar_punto_a_recicladora,
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
from app.common.security import cifrar_contrasena, validar_contrasena_segura
def _geocodificar_direccion(direccion):
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key or not direccion:
        return None, None

    try:
        cliente = googlemaps.Client(key=api_key)
        resultados = cliente.geocode(f"{direccion}, Valledupar, Cesar, Colombia")
        if not resultados:
            return None, None
        ubicacion = resultados[0]["geometry"]["location"]
        return ubicacion.get("lat"), ubicacion.get("lng")
    except Exception as error:
        print(f"No se pudo geocodificar la direccion: {error}")
        return None, None
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

    nombres = datos.get("nombres")
    apellidos = datos.get("apellidos")
    correo = datos.get("correo")
    usuario = datos.get("usuario")
    contrasena = datos.get("contrasena")
    numero_documento = datos.get("numero_documento")
    celular = datos.get("celular")
    foto_perfil = datos.get("foto_perfil", "")

    id_tipo_documento = datos.get("id_tipo_documento")

    nit_empresa = datos.get("nit_empresa")
    nombre_empresa = datos.get("nombre_empresa")
    direccion_empresa = datos.get("direccion_empresa")
    telefono_empresa = datos.get("telefono_empresa")
    camara_comercio = datos.get("camara_comercio", "")

    if not nombres:
        return {"mensaje": "Los nombres son obligatorios"}, 400

    if not apellidos:
        return {"mensaje": "Los apellidos son obligatorios"}, 400

    if not correo:
        return {"mensaje": "El correo es obligatorio"}, 400

    if not usuario:
        return {"mensaje": "El usuario es obligatorio"}, 400

    contrasena_segura, mensaje_contrasena = validar_contrasena_segura(contrasena)

    if not contrasena_segura:
        return {"mensaje": mensaje_contrasena}, 400

    if not numero_documento:
        return {"mensaje": "El numero de documento es obligatorio"}, 400

    if not id_tipo_documento:
        return {"mensaje": "El tipo de documento es obligatorio"}, 400

    if not nit_empresa:
        return {"mensaje": "El NIT de la empresa es obligatorio"}, 400

    if not nombre_empresa:
        return {"mensaje": "El nombre de la empresa es obligatorio"}, 400

    if not direccion_empresa:
        return {"mensaje": "La direccion de la empresa es obligatoria"}, 400
    contrasena_cifrada = cifrar_contrasena(contrasena)
    id_rol = 2
    id_estado = 1

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

    registrar_recicladora(
        id_usuario_creado,
        nit_empresa,
        nombre_empresa,
        direccion_empresa,
        telefono_empresa,
        camara_comercio,
        id_estado
    )
    id_punto_creado = crear_ubicacion(
        nombre_empresa,
        direccion_empresa,
        datos.get("horario", "Horario por confirmar"),
        datos.get("latitud"),
        datos.get("longitud"),
        telefono_empresa,
        f"{nombres} {apellidos}",
        id_estado
    )
    asociar_punto_a_recicladora(id_usuario_creado, id_punto_creado)

    return {
        "mensaje": "Dueno de punto ecologico registrado correctamente",
        "id_usuario": id_usuario_creado,
        "id_punto": id_punto_creado
    }, 201
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
        return {"mensaje": "No se encontro una recicladora asociada a este usuario"}, 404

    return recicladora, 200
def servicio_dashboard_recicladora(id_usuario):
    """
    Retorna datos reales del tablero para refresco automatico del frontend.
    """

    return obtener_dashboard_recicladora(id_usuario), 200
def servicio_actualizar_perfil_recicladora(id_usuario, datos):
    recicladora = buscar_recicladora_por_usuario(id_usuario)
    if not recicladora:
        return {"mensaje": "No se encontro una recicladora asociada a este usuario"}, 404

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
    direccion = datos.get("direccion") or datos.get("direccion_empresa")
    if direccion and not datos.get("latitud") and not datos.get("longitud"):
        latitud, longitud = _geocodificar_direccion(direccion)
        if latitud and longitud:
            datos["latitud"] = latitud
            datos["longitud"] = longitud

    actualizado = actualizar_punto_recicladora(id_usuario, datos)
    if not actualizado:
        return {"mensaje": "No se encontro el punto ecologico propio de esta recicladora"}, 404
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
    id_estado = datos.get("id_estado")
    if not id_estado:
        return {"mensaje": "El estado es obligatorio"}, 400

    actualizado = cambiar_estado_registro_recicladora(id_usuario, id_registro, id_estado)
    if not actualizado:
        return {"mensaje": "Registro no encontrado para el punto de esta recicladora"}, 404
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
    return {"mensaje": "Novedad registrada correctamente"}, 201
def servicio_responder_novedad_recicladora(id_usuario, id_novedad, datos):
    actualizado = responder_novedad_punto_recicladora(id_usuario, id_novedad, datos)
    if not actualizado:
        return {"mensaje": "Novedad no encontrada para el punto de esta recicladora"}, 404
    return {"mensaje": "Novedad actualizada correctamente"}, 200
def servicio_estadisticas_recicladora(id_usuario, fecha_inicio=None, fecha_fin=None):
    return obtener_estadisticas_recicladora(id_usuario, fecha_inicio, fecha_fin), 200
