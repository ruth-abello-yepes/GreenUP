"""Reglas del modulo educativo y sincronizacion opcional con YouTube."""

import os
from datetime import datetime, timedelta
from html import unescape
from threading import Lock, Thread

import requests

from app.models.educacion_model import (
    aceptar_desafio,
    completar_contenido,
    completar_desafio,
    guardar_estado_sincronizacion,
    guardar_videos_youtube,
    obtener_estado_sincronizacion,
    obtener_panel_educacion,
)


YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
_BLOQUEO_YOUTUBE = Lock()
_SINCRONIZANDO = False


def servicio_panel_educacion(id_usuario):
    try:
        return obtener_panel_educacion(id_usuario), 200
    except Exception:
        return {"mensaje": "No fue posible cargar el contenido educativo"}, 500


def servicio_completar_contenido(id_usuario, id_contenido):
    progreso, existe = completar_contenido(id_usuario, id_contenido)
    if progreso:
        return {
            "mensaje": "Progreso de la leccion guardado",
            "fecha_completado": progreso["fecha_completado"],
        }, 201
    if existe:
        return {"mensaje": "Esta leccion ya estaba registrada"}, 200
    return {"mensaje": "El contenido no existe o esta inactivo"}, 404


def servicio_aceptar_desafio(id_usuario, id_desafio):
    resultado, existe = aceptar_desafio(id_usuario, id_desafio)
    if not existe:
        return {"mensaje": "El desafio no existe o esta inactivo"}, 404
    return {
        "mensaje": "Desafio aceptado. Su cumplimiento sera auto-reportado" if resultado["estado"] == "aceptado" else "El desafio ya fue reportado",
        "estado": resultado["estado"],
    }, 200


def servicio_completar_desafio(id_usuario, id_desafio):
    resultado, estado = completar_desafio(id_usuario, id_desafio)
    if estado == "completado":
        return {
            "mensaje": "Desafio reportado como realizado",
            "estado": estado,
        }, 200
    if estado == "ya_completado":
        return {"mensaje": "Este desafio ya estaba reportado", "estado": estado}, 200
    return {"mensaje": "Primero debes aceptar el desafio"}, 409


def _sincronizacion_vigente(estado):
    if not estado or not estado.get("fecha_ultimo_intento"):
        return False
    try:
        horas = max(1, int(os.getenv("YOUTUBE_CACHE_HORAS", "24")))
    except ValueError:
        horas = 24
    return estado["fecha_ultimo_intento"] >= datetime.now() - timedelta(hours=horas)


def sincronizar_videos_youtube(forzar=False):
    """Busca videos colombianos/ambientales y conserva el resultado en PostgreSQL."""
    api_key = (os.getenv("YOUTUBE_API_KEY") or "").strip()
    if not api_key:
        return {"configurada": False, "mensaje": "YOUTUBE_API_KEY no esta configurada; se usan los videos guardados"}

    estado = obtener_estado_sincronizacion()
    if not forzar and _sincronizacion_vigente(estado):
        return {"configurada": True, "actualizada": False, "mensaje": "Se usa el cache reciente de YouTube"}

    consultas = (
        ("reciclaje separacion residuos Colombia", "Separacion"),
        ("economia circular reciclaje Colombia", "Economia circular"),
        ("residuos electronicos RAEE Colombia", "Electronicos"),
    )
    videos = []
    ids = set()
    try:
        for consulta, categoria in consultas:
            respuesta = requests.get(
                YOUTUBE_SEARCH_URL,
                params={
                    "key": api_key,
                    "part": "snippet",
                    "q": consulta,
                    "type": "video",
                    "maxResults": 8,
                    "regionCode": "CO",
                    "relevanceLanguage": "es",
                    "safeSearch": "strict",
                    "videoEmbeddable": "true",
                    "order": "relevance",
                },
                timeout=12,
            )
            respuesta.raise_for_status()
            for item in respuesta.json().get("items", []):
                video_id = item.get("id", {}).get("videoId")
                snippet = item.get("snippet", {})
                if not video_id or video_id in ids:
                    continue
                ids.add(video_id)
                miniaturas = snippet.get("thumbnails", {})
                miniatura = (miniaturas.get("high") or miniaturas.get("medium") or miniaturas.get("default") or {}).get("url")
                videos.append({
                    "titulo": unescape(snippet.get("title") or "Video educativo")[:200],
                    "descripcion": unescape(snippet.get("description") or "")[:1500],
                    "url_recurso": f"https://www.youtube-nocookie.com/embed/{video_id}",
                    "imagen": miniatura or f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
                    "categoria": categoria,
                    "fuente": unescape(snippet.get("channelTitle") or "YouTube")[:160],
                    "external_id": video_id,
                })

        guardados = guardar_videos_youtube(videos)
        guardar_estado_sincronizacion("correcto", f"{len(videos)} videos consultados; {guardados} filas actualizadas")
        return {"configurada": True, "actualizada": True, "videos": len(videos)}
    except Exception as error:
        guardar_estado_sincronizacion("error", str(error)[:1000])
        return {"configurada": True, "actualizada": False, "mensaje": "No se pudo actualizar YouTube; se conserva el cache"}


def iniciar_sincronizacion_educacion():
    """Actualiza YouTube fuera de la peticion para no retrasar la pagina."""
    def tarea():
        global _SINCRONIZANDO
        if not _BLOQUEO_YOUTUBE.acquire(blocking=False):
            return
        try:
            if _SINCRONIZANDO:
                return
            _SINCRONIZANDO = True
            sincronizar_videos_youtube()
        except Exception:
            pass
        finally:
            _SINCRONIZANDO = False
            _BLOQUEO_YOUTUBE.release()

    Thread(target=tarea, daemon=True).start()
