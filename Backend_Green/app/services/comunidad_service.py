## Archivo: comunidad_service.py
## Reglas de negocio del foro y del juego educativo por noticias.

import re

from app.models.comunidad_model import (
    crear_respuesta_foro,
    crear_tema_foro,
    listar_respuestas_tema,
    buscar_preguntas_duplicadas_otras_noticias,
    listar_preguntas_noticia,
    listar_puntajes_juego,
    listar_temas_foro,
    marcar_respuesta_moderada,
    marcar_tema_moderado,
    obtener_puntaje_ciudadano,
    registrar_resultado_juego,
    reemplazar_preguntas_noticia,
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

PALABRAS_VACIAS = {
    "a", "al", "algo", "algunas", "algunos", "ante", "antes", "como", "con", "contra",
    "cual", "cuando", "de", "del", "desde", "donde", "dos", "el", "ella", "ellas", "ellos",
    "en", "entre", "era", "eran", "es", "esa", "esas", "ese", "eso", "esos", "esta",
    "estas", "este", "esto", "estos", "fue", "fueron", "ha", "han", "hasta", "hay", "la",
    "las", "le", "les", "lo", "los", "más", "mas", "mi", "mis", "muy", "no", "nos", "o",
    "otra", "otras", "otro", "otros", "para", "pero", "por", "porque", "que", "se", "sin",
    "sobre", "son", "su", "sus", "también", "te", "tiene", "tienen", "todo", "todos", "tras",
    "tu", "un", "una", "uno", "unas", "unos", "y", "ya",
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


def _limpiar_espacios(texto):
    """Normaliza espacios en blanco para reutilizar frases de la noticia."""

    return " ".join(str(texto or "").split()).strip()


def _dividir_oraciones(texto):
    """Separa el texto en oraciones cortas para reutilizarlas en preguntas."""

    limpio = _limpiar_espacios(texto)
    if not limpio:
        return []
    partes = re.split(r"(?<=[.!?])\s+", limpio)
    return [parte.strip(" .") for parte in partes if parte.strip(" .")]


def _extraer_palabras_clave(*textos):
    """Obtiene palabras útiles del título y la descripción."""

    conteo = {}
    for texto in textos:
        for palabra in re.findall(r"[A-Za-zÁÉÍÓÚáéíóúÑñ0-9]+", str(texto or "").lower()):
            if len(palabra) < 4 or palabra in PALABRAS_VACIAS:
                continue
            conteo[palabra] = conteo.get(palabra, 0) + 1
    return [palabra for palabra, _ in sorted(conteo.items(), key=lambda item: (-item[1], item[0]))]


def _capitalizar_frase(texto):
    """Deja una frase con mayúscula inicial para mostrarla mejor."""

    valor = _limpiar_espacios(texto)
    if not valor:
        return ""
    return valor[0].upper() + valor[1:]


def _crear_titulo_alterado(titulo, palabra_original, palabra_nueva):
    """Crea un distractor cambiando una palabra del título sin romper la lectura."""

    if not palabra_original or not palabra_nueva:
        return titulo
    patron = re.compile(rf"\b{re.escape(palabra_original)}\b", re.IGNORECASE)
    reemplazado = patron.sub(palabra_nueva, titulo, count=1)
    return _capitalizar_frase(reemplazado)


def _crear_opciones_con_respuesta(correcta, distractores):
    """Arma las cuatro opciones dejando la correcta en A."""

    opciones = [correcta]
    for distractor in distractores:
        valor = _capitalizar_frase(distractor)
        if valor and valor.lower() != str(correcta).lower() and valor not in opciones:
            opciones.append(valor)
        if len(opciones) == 4:
            break
    while len(opciones) < 4:
        opciones.append(f"Opción alternativa {len(opciones)}")
    return {
        "opcion_a": opciones[0],
        "opcion_b": opciones[1],
        "opcion_c": opciones[2],
        "opcion_d": opciones[3],
        "respuesta_correcta": "A",
    }


def _resumir_texto(texto, limite=140):
    """Recorta un texto manteniendo una frase entendible para el quiz."""

    valor = _limpiar_espacios(texto)
    if len(valor) <= limite:
        return valor
    recorte = valor[:limite].rsplit(" ", 1)[0].strip()
    return f"{recorte}..."


def _construir_pregunta_desde_resumen(titulo, resumen_correcto):
    """Crea una pregunta basada en el resumen real de la noticia."""

    distractores = [
        "La noticia trata exclusivamente sobre entretenimiento y redes sociales.",
        "La publicación habla de resultados deportivos sin relación ambiental.",
        "El artículo se centra en promociones comerciales de productos de moda.",
    ]
    opciones = _crear_opciones_con_respuesta(resumen_correcto, distractores)
    return {
        "pregunta": f"¿Qué resumen sí corresponde a la noticia \"{titulo}\"?",
        **opciones,
        "explicacion": "La opción correcta resume el contenido real registrado en GreenUp.",
    }


def _construir_pregunta_de_palabra_clave(palabra_clave, titulo, palabras_clave):
    """Pregunta por un concepto real mencionado en la noticia."""

    base_distractores = [
        "farándula", "videojuegos", "pasarela", "televisión", "turismo", "fútbol",
        "celebridades", "criptomonedas", "cine", "gastronomía",
    ]
    distractores = [palabra for palabra in base_distractores if palabra not in palabras_clave and palabra != palabra_clave][:3]
    opciones = _crear_opciones_con_respuesta(palabra_clave, distractores)
    return {
        "pregunta": f"¿Cuál de estos conceptos aparece de forma directa en la noticia \"{titulo}\"?",
        **opciones,
        "explicacion": f"\"{_capitalizar_frase(palabra_clave)}\" sí hace parte del contenido de la noticia.",
    }


def _construir_pregunta_de_titulo(titulo, palabras_clave, titulo_correcto=None):
    """Pregunta por el título real de la noticia."""

    titulo_real = titulo_correcto or titulo
    palabra_a = palabras_clave[0] if palabras_clave else "ambiental"
    palabra_b = palabras_clave[1] if len(palabras_clave) > 1 else "sostenible"
    palabra_c = palabras_clave[2] if len(palabras_clave) > 2 else "urbano"
    distractores = [
        _crear_titulo_alterado(titulo_real, palabra_a, "espectáculo"),
        _crear_titulo_alterado(titulo_real, palabra_b, "moda"),
        _crear_titulo_alterado(titulo_real, palabra_c, "fútbol"),
    ]
    opciones = _crear_opciones_con_respuesta(_capitalizar_frase(titulo_real), distractores)
    return {
        "pregunta": f"¿Cuál es el título correcto de la noticia \"{titulo}\"?",
        **opciones,
        "explicacion": "La respuesta correcta coincide con el título guardado para la noticia.",
    }


def _construir_pregunta_de_fuente(fuente, titulo):
    """Pregunta por la fuente real con distractores genéricos."""

    opciones = _crear_opciones_con_respuesta(
        _capitalizar_frase(fuente),
        ["Fuente anónima sin verificar", "Cadena de mensajes reenviados", "Portal de deportes y espectáculos"],
    )
    return {
        "pregunta": f"¿Qué fuente aparece registrada para la noticia \"{titulo}\"?",
        **opciones,
        "explicacion": "La opción correcta es la fuente guardada junto a la noticia.",
    }


def _construir_pregunta_de_categoria(categoria, titulo):
    """Pregunta por la categoría real de la noticia."""

    opciones = _crear_opciones_con_respuesta(
        _capitalizar_frase(categoria),
        ["Deportes", "Entretenimiento", "Moda y farándula"],
    )
    return {
        "pregunta": f"¿En qué categoría fue clasificada la noticia \"{titulo}\"?",
        **opciones,
        "explicacion": "La categoría correcta se tomó del registro real de la noticia.",
    }


def _construir_pregunta_de_oracion(oracion, titulo, indice):
    """Convierte una oración del texto en una pregunta de comprensión literal."""

    opciones = _crear_opciones_con_respuesta(
        _resumir_texto(oracion, 160),
        [
            "La noticia afirma que el tema no tiene relación con el medio ambiente.",
            "El texto dice que no existe participación ciudadana en este caso.",
            "La publicación niega cualquier impacto o cambio asociado al tema.",
        ],
    )
    return {
        "pregunta": f"Según el texto de la noticia \"{titulo}\", ¿cuál de estas afirmaciones sí aparece en la descripción? ({indice})",
        **opciones,
        "explicacion": "La respuesta correcta fue tomada literalmente de la descripción guardada.",
    }


def _construir_pregunta_de_accion(accion_positiva, titulo):
    """Genera una pregunta sobre la acción correcta sugerida por la noticia."""

    opciones = _crear_opciones_con_respuesta(
        _capitalizar_frase(accion_positiva),
        [
            "Ignorar la separación de residuos y mezclar todos los materiales",
            "Quemar residuos para deshacerse de ellos más rápido",
            "Depositar materiales aprovechables junto con basura ordinaria",
        ],
    )
    return {
        "pregunta": f"De acuerdo con lo que plantea la noticia \"{titulo}\", ¿qué acción es la más adecuada?",
        **opciones,
        "explicacion": "La noticia apunta a una práctica ambiental correcta relacionada con su contenido.",
    }


def _construir_pregunta_de_beneficio(beneficio, titulo):
    """Pregunta por la consecuencia positiva asociada al texto."""

    opciones = _crear_opciones_con_respuesta(
        _capitalizar_frase(beneficio),
        [
            "Aumentar la contaminación y reducir la participación ciudadana",
            "Eliminar el reciclaje como práctica cotidiana",
            "Promover el uso descontrolado de materiales desechables",
        ],
    )
    return {
        "pregunta": f"¿Qué beneficio ambiental se relaciona con la noticia \"{titulo}\"?",
        **opciones,
        "explicacion": "La opción correcta resume el beneficio que se desprende del texto de la noticia.",
    }


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
    """Permite responder un tema del foro sin asignar recompensas por ahora."""

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
    Crea tres preguntas educativas usando el contenido real de la noticia.

    El objetivo es que el cuestionario se sienta más ligado al artículo,
    pero sin depender de servicios externos adicionales.
    """

    fuente = _limpiar_espacios(noticia.get("fuente") or "GreenUp")
    categoria = _limpiar_espacios(noticia.get("categoria") or "Medio ambiente")
    titulo = _limpiar_espacios(noticia.get("titulo") or "Noticia ambiental")
    titulo_pregunta = f"{titulo} (registro GreenUp {noticia.get('id_noticia')})"
    descripcion = _limpiar_espacios(noticia.get("descripcion") or "")
    titulo_minuscula = titulo.lower()
    descripcion_minuscula = descripcion.lower()
    oraciones = _dividir_oraciones(descripcion)
    palabras_clave = _extraer_palabras_clave(titulo, descripcion)

    accion_positiva = "separar residuos y usar correctamente los puntos ecológicos"
    beneficio = "reducir el impacto ambiental y fortalecer la cultura de reciclaje"

    if "plást" in titulo_minuscula or "plást" in descripcion_minuscula:
        accion_positiva = "reducir plásticos de un solo uso y separar envases aprovechables"
        beneficio = "evitar contaminación en calles, ríos y rellenos sanitarios"
    elif "orgán" in titulo_minuscula or "compost" in descripcion_minuscula:
        accion_positiva = "separar residuos orgánicos para compostaje o aprovechamiento"
        beneficio = "aprovechar mejor los residuos y disminuir malos olores"
    elif "electr" in titulo_minuscula or "raee" in titulo_minuscula or "electr" in descripcion_minuscula:
        accion_positiva = "llevar aparatos electrónicos a puntos autorizados"
        beneficio = "evitar contaminación por componentes peligrosos"
    elif "vidrio" in titulo_minuscula or "cartón" in titulo_minuscula or "papel" in titulo_minuscula:
        accion_positiva = "clasificar materiales aprovechables y entregarlos limpios"
        beneficio = "facilitar el aprovechamiento de materiales reciclables"

    if not descripcion:
        descripcion = f"La noticia fue registrada en GreenUp dentro de la categoría {categoria} y proviene de la fuente {fuente}."
        oraciones = _dividir_oraciones(descripcion)

    primera_oracion = oraciones[0] if oraciones else descripcion
    segunda_oracion = oraciones[1] if len(oraciones) > 1 else descripcion
    palabra_principal = palabras_clave[0] if palabras_clave else categoria.lower()

    return [
        _construir_pregunta_de_titulo(titulo_pregunta, palabras_clave, titulo),
        _construir_pregunta_desde_resumen(titulo_pregunta, _resumir_texto(primera_oracion, 160)),
        _construir_pregunta_de_accion(accion_positiva, titulo_pregunta),
    ]


def _preguntas_necesitan_actualizacion(preguntas_guardadas):
    """Detecta si el cuestionario viejo debe regenerarse."""

    if len(preguntas_guardadas) != 3:
        return True

    patrones_viejos = (
        "¿cuál es el tema principal de la noticia",
        "¿qué acción ciudadana se relaciona mejor con el aprendizaje de esta noticia?",
        "¿desde qué fuente se registró esta noticia en greenup?",
        "¿qué fuente aparece asociada a esta noticia dentro de greenup?",
        "¿qué resumen representa mejor el contenido de la noticia?",
        "¿cuál es el título correcto de la noticia?",
        "¿en qué categoría fue clasificada esta noticia?",
    )
    for pregunta in preguntas_guardadas:
        texto = str(pregunta.get("pregunta") or "").strip().lower()
        if any(texto.startswith(patron) for patron in patrones_viejos):
            return True

    return False


def servicio_listar_preguntas_noticia(id_noticia):
    """Entrega las preguntas del juego para una noticia."""

    preguntas = listar_preguntas_noticia(id_noticia)
    textos = [pregunta.get("pregunta") for pregunta in preguntas]
    duplicadas = buscar_preguntas_duplicadas_otras_noticias(id_noticia, textos) if preguntas else []

    if preguntas and not _preguntas_necesitan_actualizacion(preguntas) and not duplicadas:
        return {"preguntas": preguntas}, 200

    noticias = listar_noticias()
    noticia = next((item for item in noticias if int(item.get("id_noticia")) == int(id_noticia)), None)
    if not noticia:
        return {"mensaje": "La noticia no existe"}, 404

    generadas = _preguntas_generadas_desde_noticia(noticia)
    reemplazar_preguntas_noticia(id_noticia, generadas)

    return {"preguntas": listar_preguntas_noticia(id_noticia)}, 200


def servicio_registrar_preguntas_noticia(id_noticia, datos):
    """Permite guardar manualmente un cuestionario de tres preguntas para una noticia."""

    preguntas = datos.get("preguntas") or []
    if not isinstance(preguntas, list):
        return {"mensaje": "Las preguntas deben enviarse en una lista"}, 400

    if len(preguntas) != 3:
        return {"mensaje": "Debes registrar exactamente 3 preguntas por noticia"}, 400

    errores = []
    preguntas_limpias = []
    preguntas_normalizadas = set()
    for indice, pregunta in enumerate(preguntas, start=1):
        fila = {
            "pregunta": str((pregunta or {}).get("pregunta") or "").strip(),
            "opcion_a": str((pregunta or {}).get("opcion_a") or "").strip(),
            "opcion_b": str((pregunta or {}).get("opcion_b") or "").strip(),
            "opcion_c": str((pregunta or {}).get("opcion_c") or "").strip(),
            "opcion_d": str((pregunta or {}).get("opcion_d") or "").strip(),
            "respuesta_correcta": str((pregunta or {}).get("respuesta_correcta") or "").strip().upper(),
            "explicacion": str((pregunta or {}).get("explicacion") or "").strip(),
        }

        if not all([fila["pregunta"], fila["opcion_a"], fila["opcion_b"], fila["opcion_c"], fila["opcion_d"]]):
            errores.append(f"La pregunta {indice} tiene campos vacíos.")
        if fila["respuesta_correcta"] not in {"A", "B", "C", "D"}:
            errores.append(f"La pregunta {indice} debe indicar una respuesta correcta entre A, B, C o D.")

        normalizada = _limpiar_espacios(fila["pregunta"]).lower()
        if normalizada in preguntas_normalizadas:
            errores.append(f"La pregunta {indice} está repetida dentro del mismo cuestionario.")
        preguntas_normalizadas.add(normalizada)
        preguntas_limpias.append(fila)

    if errores:
        return {"mensaje": "No se pudieron guardar las preguntas", "errores": errores}, 400

    noticias = listar_noticias()
    noticia = next((item for item in noticias if int(item.get("id_noticia")) == int(id_noticia)), None)
    if not noticia:
        return {"mensaje": "La noticia no existe"}, 404

    duplicadas = buscar_preguntas_duplicadas_otras_noticias(
        id_noticia,
        [pregunta["pregunta"] for pregunta in preguntas_limpias],
    )
    if duplicadas:
        return {
            "mensaje": "No puedes repetir preguntas que ya pertenecen a otra noticia.",
            "errores": [
                f"La pregunta \"{item['pregunta']}\" ya existe en la noticia {item['id_noticia']}."
                for item in duplicadas
            ],
        }, 400

    reemplazar_preguntas_noticia(id_noticia, preguntas_limpias)
    return {
        "mensaje": "Preguntas registradas correctamente",
        "preguntas": listar_preguntas_noticia(id_noticia),
    }, 201


def servicio_resolver_juego_noticia(id_usuario, id_noticia, datos):
    """Califica las respuestas del ciudadano y registra progreso educativo sin sumar puntos."""

    respuestas = datos.get("respuestas") or {}
    if not isinstance(respuestas, dict):
        return {"mensaje": "Las respuestas deben enviarse como objeto"}, 400

    preguntas = listar_preguntas_noticia(id_noticia)
    if not preguntas:
        respuesta, estado = servicio_listar_preguntas_noticia(id_noticia)
        if estado != 200:
            return respuesta, estado
        preguntas = respuesta["preguntas"]

    faltantes = []
    correctas = 0
    detalle = []
    for indice, pregunta in enumerate(preguntas, start=1):
        seleccion = str(respuestas.get(str(pregunta["id_pregunta"]), "")).upper()
        if seleccion not in {"A", "B", "C", "D"}:
            faltantes.append({
                "id_pregunta": pregunta["id_pregunta"],
                "numero": indice,
                "mensaje": f"Debes responder la pregunta {indice}.",
            })
            continue
        es_correcta = seleccion == str(pregunta["respuesta_correcta"]).upper()
        if es_correcta:
            correctas += 1
        detalle.append({
            "id_pregunta": pregunta["id_pregunta"],
            "numero": indice,
            "pregunta": pregunta["pregunta"],
            "seleccion": seleccion,
            "respuesta_correcta": pregunta["respuesta_correcta"],
            "correcta": es_correcta,
            "explicacion": pregunta.get("explicacion"),
        })

    if faltantes:
        return {
            "mensaje": "Debes responder todas las preguntas antes de enviar.",
            "errores": faltantes,
        }, 400

    total = len(preguntas)
    puntaje = 0
    puntaje_nuevo = registrar_resultado_juego(id_noticia, id_usuario, puntaje, correctas, total)
    puntaje_actual = obtener_puntaje_ciudadano(id_usuario) or {
        "puntos_total": puntaje,
        "noticias_completadas": 1,
    }

    return {
        "mensaje": "Juego calificado correctamente",
        "puntaje_obtenido": puntaje,
        "puntos_sumados": 0,
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
