# Servicio de preguntas frecuentes

from app.models.faq_model import (
    crear_pregunta,
    listar_preguntas
)


def servicio_crear_pregunta(data):
    pregunta = data.get("pregunta")
    respuesta = data.get("respuesta")
    categoria = data.get("categoria")
    orden = data.get("orden", 0)

    if not pregunta:
        return {"mensaje": "La pregunta es obligatoria"}, 400

    if not respuesta:
        return {"mensaje": "La respuesta es obligatoria"}, 400

    crear_pregunta(pregunta, respuesta, categoria, orden)

    return {"mensaje": "Pregunta creada correctamente"}, 201


def servicio_listar_preguntas():
    datos = listar_preguntas()
    return datos, 200