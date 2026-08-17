## Archivo: comunidad_service.py
## Reglas de negocio del foro y del juego educativo por noticias.

from app.models.comunidad_model import (
    crear_respuesta_foro,
    crear_pregunta_noticia,
    crear_tema_foro,
    listar_respuestas_tema,
    listar_preguntas_noticia,
    listar_puntajes_juego,
    listar_temas_foro,
    marcar_respuesta_moderada,
    marcar_tema_moderado,
    obtener_puntaje_ciudadano,
    registrar_resultado_juego,
    sumar_puntos_respuesta_foro,
)
from app.models.noticias_model import listar_noticias
from app.models.notificaciones_model import crear_notificacion


PALABRAS_PROHIBIDAS = {
    "hp", "hpta", "gonorrea", "marica", "marika", "malparido", "malparida",
    "pirobo", "perra", "mierda", "idiota", "estupido", "estupida",
    "imbecil", "puta", "puta", "cule", "caremonda", "hijueputa",
}

TERMINOS_IMAGEN_INDEBIDA = {
    "adult", "porno", "xxx", "desnudo", "desnuda", "sex", "onlyfans",
}


def _texto_tiene_lenguaje_inadecuado(*textos):
    """Detecta palabras prohibidas dentro del texto enviado al foro."""

    contenido = " ".join(str(texto or "").lower() for texto in textos)
    for palabra in PALABRAS_PROHIBIDAS:
        if palabra in contenido:
            return True
    return False


def _imagen_es_aceptable(imagen):
    """Filtra nombres o URLs con pistas evidentes de contenido indebido."""

    valor = str(imagen or "").strip().lower()
    if not valor:
        return True
    return not any(termino in valor for termino in TERMINOS_IMAGEN_INDEBIDA)


def servicio_listar_foro(id_rol):
    """Lista los temas visibles para el rol actual."""

    temas = listar_temas_foro(id_rol)
    for tema in temas:
        tema["respuestas"] = listar_respuestas_tema(tema["id_tema"])
    return temas, 200


def servicio_crear_tema_foro(id_usuario, id_rol, datos):
    """
    Crea un tema nuevo en el foro.

    Si detecta lenguaje inadecuado, el tema se marca como moderado y se rechaza.
    """

    titulo = (datos.get("titulo") or "").strip()
    contenido = (datos.get("contenido") or "").strip()
    imagen = (datos.get("imagen") or "").strip() or None
    tipo_publicacion = (datos.get("tipo_publicacion") or "opinion").strip().lower()

    if id_rol == 3:
        return {"mensaje": "El ciudadano no puede publicar temas nuevos; solo puede responder."}, 403

    if not titulo or not contenido:
        return {"mensaje": "El titulo y el contenido son obligatorios"}, 400

    if tipo_publicacion not in {"pregunta", "opinion", "tema"}:
        tipo_publicacion = "opinion"

    if not _imagen_es_aceptable(imagen):
        return {"mensaje": "La imagen no pasó la validación básica de contenido permitido"}, 400

    if _texto_tiene_lenguaje_inadecuado(titulo, contenido):
        id_tema = crear_tema_foro(titulo, contenido, imagen, tipo_publicacion, id_usuario, id_rol, moderado=True)
        marcar_tema_moderado(id_tema)
        return {
            "mensaje": "La publicacion fue eliminada automaticamente por lenguaje inadecuado"
        }, 400

    id_tema = crear_tema_foro(titulo, contenido, imagen, tipo_publicacion, id_usuario, id_rol)
    crear_notificacion(
        "Nueva publicacion en foro",
        "La comunidad GreenUp tiene un nuevo tema visible para los usuarios.",
        None,
        1,
    )
    crear_notificacion(
        "Nuevo foro disponible",
        "Hay un nuevo tema en la comunidad GreenUp para responder.",
        None,
        3,
    )
    crear_notificacion(
        "Nuevo foro disponible",
        "Se publicó un nuevo tema en la comunidad GreenUp.",
        None,
        2,
    )
    return {"mensaje": "Tema publicado correctamente", "id_tema": id_tema}, 201


def servicio_responder_tema_foro(id_tema, id_usuario, id_rol, datos):
    """Permite responder un tema del foro y asigna puntos al ciudadano."""

    respuesta = (datos.get("respuesta") or "").strip()
    imagen = (datos.get("imagen") or "").strip() or None

    if not respuesta:
        return {"mensaje": "La respuesta es obligatoria"}, 400

    if not _imagen_es_aceptable(imagen):
        return {"mensaje": "La imagen no pasó la validación básica de contenido permitido"}, 400

    if _texto_tiene_lenguaje_inadecuado(respuesta):
        id_respuesta = crear_respuesta_foro(id_tema, id_usuario, id_rol, respuesta, imagen, moderado=True)
        marcar_respuesta_moderada(id_respuesta)
        return {"mensaje": "La respuesta fue eliminada automáticamente por lenguaje inadecuado"}, 400

    id_respuesta = crear_respuesta_foro(id_tema, id_usuario, id_rol, respuesta, imagen)
    puntos_otorgados = 0
    if id_rol == 3:
        sumar_puntos_respuesta_foro(id_usuario, 5)
        puntos_otorgados = 5

    crear_notificacion(
        "Nueva respuesta en foro",
        "Un usuario respondió un tema de la comunidad GreenUp.",
        None,
        1,
    )
    return {
        "mensaje": "Respuesta enviada correctamente",
        "id_respuesta": id_respuesta,
        "puntos_otorgados": puntos_otorgados,
    }, 201


def _preguntas_generadas_desde_noticia(noticia):
    """
    Crea tres preguntas simples y educativas a partir de la noticia.

    Se prioriza que el juego sea entendible y estable para el prototipo.
    """

    fuente = noticia.get("fuente") or "GreenUp"
    categoria = noticia.get("categoria") or "Medio ambiente"
    titulo = noticia.get("titulo") or "Noticia ambiental"

    return [
        {
            "pregunta": f"¿Cuál es el tema principal de la noticia \"{titulo}\"?",
            "opcion_a": categoria,
            "opcion_b": "Deportes",
            "opcion_c": "Entretenimiento",
            "opcion_d": "Tecnología móvil",
            "respuesta_correcta": "A",
            "explicacion": "La noticia fue clasificada por GreenUp dentro de esa categoría ambiental.",
        },
        {
            "pregunta": "¿Qué acción ciudadana se relaciona mejor con el aprendizaje de esta noticia?",
            "opcion_a": "Separar correctamente residuos y participar activamente",
            "opcion_b": "Quemar residuos para reducir espacio",
            "opcion_c": "Mezclar reciclables con orgánicos",
            "opcion_d": "Ignorar los puntos ecológicos",
            "respuesta_correcta": "A",
            "explicacion": "La educación ambiental de GreenUp siempre busca decisiones responsables y sostenibles.",
        },
        {
            "pregunta": f"¿Desde qué fuente se registró esta noticia en GreenUp?",
            "opcion_a": fuente,
            "opcion_b": "Documento interno sin fuente",
            "opcion_c": "Cadena de mensajes anónimos",
            "opcion_d": "Foro sin verificación",
            "respuesta_correcta": "A",
            "explicacion": "GreenUp guarda la fuente asociada para mantener trazabilidad de la información.",
        },
    ]


def servicio_listar_preguntas_noticia(id_noticia):
    """Entrega las preguntas del juego para una noticia."""

    preguntas = listar_preguntas_noticia(id_noticia)
    if preguntas:
        return {"preguntas": preguntas}, 200

    noticias = listar_noticias()
    noticia = next((item for item in noticias if int(item.get("id_noticia")) == int(id_noticia)), None)
    if not noticia:
        return {"mensaje": "La noticia no existe"}, 404

    generadas = _preguntas_generadas_desde_noticia(noticia)
    for pregunta in generadas:
        crear_pregunta_noticia(
            id_noticia,
            pregunta["pregunta"],
            pregunta["opcion_a"],
            pregunta["opcion_b"],
            pregunta["opcion_c"],
            pregunta["opcion_d"],
            pregunta["respuesta_correcta"],
            pregunta["explicacion"],
        )

    return {"preguntas": listar_preguntas_noticia(id_noticia)}, 200


def servicio_resolver_juego_noticia(id_usuario, id_noticia, datos):
    """Califica las respuestas del ciudadano y suma puntos."""

    respuestas = datos.get("respuestas") or {}
    if not isinstance(respuestas, dict):
        return {"mensaje": "Las respuestas deben enviarse como objeto"}, 400

    preguntas = listar_preguntas_noticia(id_noticia)
    if not preguntas:
        respuesta, estado = servicio_listar_preguntas_noticia(id_noticia)
        if estado != 200:
            return respuesta, estado
        preguntas = respuesta["preguntas"]

    correctas = 0
    detalle = []
    for pregunta in preguntas:
        seleccion = str(respuestas.get(str(pregunta["id_pregunta"]), "")).upper()
        es_correcta = seleccion == str(pregunta["respuesta_correcta"]).upper()
        if es_correcta:
            correctas += 1
        detalle.append({
            "id_pregunta": pregunta["id_pregunta"],
            "seleccion": seleccion,
            "respuesta_correcta": pregunta["respuesta_correcta"],
            "correcta": es_correcta,
            "explicacion": pregunta.get("explicacion"),
        })

    total = len(preguntas)
    puntaje = correctas * 10
    puntaje_nuevo = registrar_resultado_juego(id_noticia, id_usuario, puntaje, correctas, total)
    puntaje_actual = obtener_puntaje_ciudadano(id_usuario) or {
        "puntos_total": puntaje,
        "noticias_completadas": 1,
    }

    return {
        "mensaje": "Juego calificado correctamente",
        "puntaje_obtenido": puntaje,
        "puntos_sumados": puntaje_nuevo,
        "respuestas_correctas": correctas,
        "total_preguntas": total,
        "detalle": detalle,
        "resumen_ciudadano": puntaje_actual,
    }, 200


def servicio_listar_puntajes_juego():
    """Entrega al administrador el tablero de puntajes."""

    return listar_puntajes_juego(), 200


def servicio_puntaje_ciudadano(id_usuario):
    """Entrega al ciudadano su propio progreso del juego."""

    return {
        "puntaje": obtener_puntaje_ciudadano(id_usuario) or {
            "id_usuario": id_usuario,
            "puntos_total": 0,
            "noticias_completadas": 0,
            "ultima_actualizacion": None,
        }
    }, 200
