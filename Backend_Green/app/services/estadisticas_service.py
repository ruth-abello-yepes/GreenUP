# Servicio de estadísticas

from app.models.estadisticas_model import (
    total_reciclajes,
    total_cantidad_reciclada
)


def servicio_ver_estadisticas():
    reciclajes = total_reciclajes()
    cantidad = total_cantidad_reciclada()

    return {
        "total_reciclajes": reciclajes["total_reciclajes"],
        "total_cantidad": cantidad["total_cantidad"]
    }, 200