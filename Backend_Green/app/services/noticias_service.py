## Archivo: noticias_service.py
## Integra noticias creadas en GreenUp y artículos ambientales colombianos.

import math
import os
import re
from datetime import datetime, timedelta, timezone
from difflib import SequenceMatcher
from html import unescape
from threading import Lock, Thread
from urllib.parse import urlparse

import requests

from app.models.noticias_model import (
    cambiar_estado_noticia,
    crear_noticia,
    existen_noticias_activas,
    guardar_estado_sincronizacion,
    guardar_noticias_externas,
    listar_noticias,
    listar_noticias_ambientales,
    obtener_estado_sincronizacion,
)


PROVEEDOR = "world-news-api"
WORLD_NEWS_URL = "https://api.worldnewsapi.com/search-news"
CONSULTA_AMBIENTAL_COLOMBIA = (
    "reciclaje OR residuos OR ambiente OR ambiental OR biodiversidad OR sostenibilidad"
)
UBICACIONES_COLOMBIA_TEXTO = (
    "colombia", "colombiano", "colombiana", "bogotá", "bogota", "medellín",
    "medellin", "cali", "barranquilla", "cartagena", "santa marta",
    "bucaramanga", "cúcuta", "cucuta", "pereira", "manizales", "armenia",
    "villavicencio", "valledupar", "montería", "monteria", "sincelejo",
    "ibagué", "ibague", "neiva", "pasto", "popayán", "popayan", "tunja",
    "riohacha", "quibdó", "quibdo", "florencia", "yopal", "mocoa", "leticia",
    "amazonas", "antioquia", "arauca", "atlántico", "atlantico", "bolívar",
    "bolivar", "boyacá", "boyaca", "caldas", "caquetá", "caqueta", "casanare",
    "cauca", "cesar", "chocó", "choco", "córdoba", "cordoba", "cundinamarca",
    "guainía", "guainia", "guaviare", "huila", "la guajira", "magdalena",
    "nariño", "narino", "norte de santander", "putumayo", "quindío", "quindio",
    "risaralda", "san andrés", "san andres", "santander", "sucre", "tolima",
    "valle del cauca", "vaupés", "vaupes", "vichada",
)
TERMINOS_AMBIENTALES = (
    "recicl", "residuo", "ambiente", "ambiental", "biodiversidad",
    "sostenibilidad", "conservación", "conservacion", "ecolog", "contamin",
    "deforest", "climát", "climat", "incendio", "ecosistema", "fauna", "flora",
    "energía renovable", "energia renovable", "escombro", "basura", "vivero",
)
TERMINOS_AMBIENTALES_TITULO = (
    "recicl", "residuo", "ambiente", "ambiental", "biodiversidad",
    "sostenib", "conservación", "conservacion", "ecolog", "contamin",
    "deforest", "climát", "climat", "incendio", "fuego", "ecosistema",
    "fauna", "flora", "especie", "energía renovable", "energia renovable",
    "basura", "vivero",
)
CONTEXTO_GESTION_RESIDUOS = (
    "manejo", "disposición", "disposicion", "aprovechamiento", "recicl",
    "reutiliz", "segunda vida", "sitio autorizado", "gestión", "gestion",
)
PALABRAS_VACIAS_TITULO = {
    "a", "al", "ante", "con", "de", "del", "el", "en", "la", "las",
    "los", "más", "por", "para", "que", "se", "su", "sus", "un", "una",
    "y",
}
_BLOQUEO_SINCRONIZACION = Lock()
_SINCRONIZACION_EN_CURSO = False
_BLOQUEO_CACHE_LISTADOS = Lock()
_CACHE_LISTADOS = {}
_CACHE_LISTADOS_SEGUNDOS = 300


def _fecha_articulo(valor):
    if not valor:
        return datetime.now(timezone.utc).replace(tzinfo=None)
    try:
        return datetime.fromisoformat(valor.replace("Z", "+00:00")).astimezone(timezone.utc).replace(tzinfo=None)
    except (TypeError, ValueError):
        return datetime.now(timezone.utc).replace(tzinfo=None)


def _fuente_articulo(articulo):
    fuente = articulo.get("source") or articulo.get("source_name")
    if isinstance(fuente, dict):
        fuente = fuente.get("name") or fuente.get("url")
    if fuente:
        return str(fuente)[:200]
    dominio = urlparse(articulo.get("url") or "").netloc
    return dominio.removeprefix("www.")[:200] or "Medio colombiano"


def _url_http_segura(valor):
    if not isinstance(valor, str):
        return None
    url = valor.strip()
    return url if urlparse(url).scheme.lower() in {"http", "https"} else None


def _limpiar_texto(valor):
    if not isinstance(valor, str):
        return ""
    sin_html = re.sub(r"<[^>]+>", " ", unescape(valor))
    return " ".join(sin_html.split()).strip()


def _clave_titulo(titulo):
    clave = re.sub(r"[^\w\s]", " ", titulo.casefold())
    clave = " ".join(clave.split())
    return re.sub(r"^(el|la|los|las|un|una)\s+", "", clave)


def _titulos_son_similares(actual, existente):
    if SequenceMatcher(None, actual, existente).ratio() >= 0.88:
        return True
    tokens_actual = {
        token for token in actual.split()
        if token not in PALABRAS_VACIAS_TITULO and len(token) > 2
    }
    tokens_existente = {
        token for token in existente.split()
        if token not in PALABRAS_VACIAS_TITULO and len(token) > 2
    }
    if not tokens_actual or not tokens_existente:
        return False
    compartidos = tokens_actual & tokens_existente
    proporcion = len(compartidos) / min(len(tokens_actual), len(tokens_existente))
    return len(compartidos) >= 4 and proporcion >= 0.32


def _normalizar_articulos(articulos):
    noticias = []
    titulos_vistos = set()
    for articulo in articulos:
        titulo = _limpiar_texto(articulo.get("title"))
        url = _url_http_segura(articulo.get("url"))
        descripcion = _limpiar_texto(articulo.get("summary") or articulo.get("description"))
        imagen = _url_http_segura(articulo.get("image") or articulo.get("image_url"))
        titulo_busqueda = titulo.casefold()
        contenido_principal = f"{titulo} {descripcion}".casefold()
        ubicacion_en_titulo = any(
            re.search(rf"(?<!\w){re.escape(ubicacion)}(?!\w)", titulo_busqueda)
            for ubicacion in UBICACIONES_COLOMBIA_TEXTO
        )
        es_de_colombia = ubicacion_en_titulo or "colombia" in contenido_principal
        es_ambiental = any(termino in contenido_principal for termino in TERMINOS_AMBIENTALES)
        es_ambiental_en_titulo = any(
            termino in titulo_busqueda for termino in TERMINOS_AMBIENTALES_TITULO
        )
        es_nota_de_escombros = (
            "escombro" in titulo_busqueda
            and any(contexto in contenido_principal for contexto in CONTEXTO_GESTION_RESIDUOS)
        )
        titulo_normalizado = _clave_titulo(titulo)
        titulo_similar = any(
            _titulos_son_similares(titulo_normalizado, existente)
            for existente in titulos_vistos
        )
        if (
            not titulo or not url or not imagen
            or titulo_normalizado in titulos_vistos or titulo_similar
            or not es_de_colombia or not es_ambiental
            or not (es_ambiental_en_titulo or es_nota_de_escombros)
        ):
            continue
        titulos_vistos.add(titulo_normalizado)
        categoria = "Reciclaje" if any(
            termino in contenido_principal for termino in ("recicl", "residuo", "economía circular")
        ) else "Medio ambiente"
        noticias.append({
            "titulo": titulo[:500],
            "descripcion": descripcion or None,
            "imagen": imagen,
            "fecha_publicacion": _fecha_articulo(
                articulo.get("publish_date") or articulo.get("published_at") or articulo.get("publishedAt")
            ),
            "url_original": url[:1000],
            "fuente": _fuente_articulo(articulo),
            "categoria": categoria,
            "origen": "World News API",
        })
    return noticias


def _consultar_world_news(api_key):
    respuesta = requests.get(
        WORLD_NEWS_URL,
        params={
            "text": CONSULTA_AMBIENTAL_COLOMBIA,
            "language": "es",
            "source-country": "co",
            "sort": "publish-time",
            "sort-direction": "DESC",
            "number": 100,
        },
        headers={"x-api-key": api_key},
        timeout=15,
    )
    respuesta.raise_for_status()
    return respuesta.json().get("news", [])


def _sincronizacion_vigente(estado):
    if not estado or not estado.get("fecha_ultimo_intento"):
        return False
    try:
        minutos_cache = max(30, int(os.getenv("NOTICIAS_CACHE_MINUTOS", "120")))
    except ValueError:
        minutos_cache = 120
    return estado["fecha_ultimo_intento"] >= datetime.now() - timedelta(minutes=minutos_cache)


def _limpiar_cache_listados():
    with _BLOQUEO_CACHE_LISTADOS:
        _CACHE_LISTADOS.clear()


def _listar_noticias_desde_cache(busqueda, pagina, por_pagina):
    clave = (busqueda or "", pagina, por_pagina)
    ahora = datetime.now()
    with _BLOQUEO_CACHE_LISTADOS:
        cache = _CACHE_LISTADOS.get(clave)
        if cache and (ahora - cache["guardado_en"]).total_seconds() < _CACHE_LISTADOS_SEGUNDOS:
            return cache["datos"]

    datos = listar_noticias_ambientales(busqueda, pagina, por_pagina)
    with _BLOQUEO_CACHE_LISTADOS:
        _CACHE_LISTADOS[clave] = {"guardado_en": ahora, "datos": datos}
    return datos


def iniciar_precalentamiento_cache_noticias():
    """Carga la primera página al iniciar Flask para acelerar la primera visita."""
    def precalentar():
        try:
            _listar_noticias_desde_cache(None, 1, 10)
        except Exception:
            # El endpoint conserva su manejo normal de errores si la BD no está disponible.
            pass

    Thread(target=precalentar, daemon=True).start()


def sincronizar_noticias_ambientales():
    """Actualiza el caché con la clave privada del servidor y reutiliza los datos guardados."""
    api_key = os.getenv("WORLD_NEWS_API_KEY")
    estado_anterior = obtener_estado_sincronizacion(PROVEEDOR)

    if _sincronizacion_vigente(estado_anterior):
        return {
            "configurada": True,
            "actualizada": False,
            "estado": "cache",
            "mensaje": "Se están usando las noticias almacenadas recientemente",
        }

    if not api_key:
        return {
            "configurada": False,
            "actualizada": False,
            "estado": "no_configurada",
            "mensaje": "Falta configurar WORLD_NEWS_API_KEY en el backend",
        }

    try:
        articulos = _normalizar_articulos(_consultar_world_news(api_key))
        insertadas = guardar_noticias_externas(articulos)
    except (requests.RequestException, ValueError) as error:
        detalle = f"World News API: {str(error)[:300]}"
        guardar_estado_sincronizacion(PROVEEDOR, "error", detalle)
        return {
            "configurada": True,
            "actualizada": False,
            "estado": "error",
            "mensaje": "No fue posible actualizar la fuente; se muestran las últimas noticias guardadas.",
        }

    mensaje = f"Sincronización completada: {insertadas} noticias ambientales nuevas de Colombia"
    guardar_estado_sincronizacion(PROVEEDOR, "completada", mensaje)
    _limpiar_cache_listados()
    return {
        "configurada": True,
        "actualizada": True,
        "estado": "completada",
        "mensaje": mensaje,
    }


def _ejecutar_sincronizacion_en_segundo_plano():
    global _SINCRONIZACION_EN_CURSO
    try:
        sincronizar_noticias_ambientales()
    finally:
        with _BLOQUEO_SINCRONIZACION:
            _SINCRONIZACION_EN_CURSO = False


def _iniciar_sincronizacion_en_segundo_plano():
    global _SINCRONIZACION_EN_CURSO
    with _BLOQUEO_SINCRONIZACION:
        if _SINCRONIZACION_EN_CURSO:
            return False
        _SINCRONIZACION_EN_CURSO = True
    Thread(target=_ejecutar_sincronizacion_en_segundo_plano, daemon=True).start()
    return True


def _estado_cache_sin_bloqueo(estado_anterior):
    api_key = os.getenv("WORLD_NEWS_API_KEY")
    if not api_key:
        return {
            "configurada": False,
            "actualizada": False,
            "estado": "no_configurada",
            "mensaje": "Se muestran noticias guardadas; falta configurar WORLD_NEWS_API_KEY",
        }

    if _sincronizacion_vigente(estado_anterior):
        return {
            "configurada": True,
            "actualizada": False,
            "estado": "cache",
            "mensaje": "Noticias cargadas desde GreenUp",
        }

    iniciada = _iniciar_sincronizacion_en_segundo_plano()
    return {
        "configurada": True,
        "actualizada": False,
        "estado": "actualizando",
        "mensaje": (
            "Noticias cargadas; actualizando novedades en segundo plano"
            if iniciada else "Noticias cargadas; la actualización continúa en segundo plano"
        ),
    }


def servicio_crear_noticia(datos):
    titulo = datos.get("titulo")
    if not titulo:
        return {"mensaje": "El titulo es obligatorio"}, 400
    id_noticia = crear_noticia(
        titulo,
        datos.get("descripcion"),
        datos.get("imagen"),
        datos.get("id_usuario"),
    )
    return {"mensaje": "Noticia creada correctamente", "id_noticia": id_noticia}, 201


def servicio_listar_noticias():
    return listar_noticias(), 200


def servicio_listar_noticias_ambientales(busqueda=None, pagina=1, por_pagina=9):
    noticias, total, estado_anterior = _listar_noticias_desde_cache(busqueda, pagina, por_pagina)
    hay_cache = total > 0 or (bool(busqueda) and existen_noticias_activas())
    if hay_cache:
        sincronizacion = _estado_cache_sin_bloqueo(estado_anterior)
    else:
        sincronizacion = sincronizar_noticias_ambientales()
        _limpiar_cache_listados()
        noticias, total, _ = _listar_noticias_desde_cache(busqueda, pagina, por_pagina)
    return {
        "noticias": noticias,
        "paginacion": {
            "pagina": pagina,
            "por_pagina": por_pagina,
            "total": total,
            "total_paginas": math.ceil(total / por_pagina) if total else 0,
        },
        "sincronizacion": sincronizacion,
        "atribucion": {
            "texto": "Noticias proporcionadas por World News API",
            "url": "https://worldnewsapi.com/",
        },
        "atribuciones": [
            {
                "texto": "World News API",
                "url": "https://worldnewsapi.com/",
            },
        ],
    }, 200


def servicio_cambiar_estado_noticia(id_noticia, datos):
    id_estado = datos.get("id_estado")
    if not id_estado:
        return {"mensaje": "El estado es obligatorio"}, 400
    actualizado = cambiar_estado_noticia(id_noticia, id_estado)
    if not actualizado:
        return {"mensaje": "Noticia no encontrada"}, 404
    return {"mensaje": "Estado de noticia actualizado correctamente"}, 200
