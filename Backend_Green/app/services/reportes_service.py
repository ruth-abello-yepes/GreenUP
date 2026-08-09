## Archivo: reportes_service.py
## Servicio de negocio: valida reglas del sistema antes de llamar a modelos.

from app.models.reportes_model import listar_reporte_reciclaje


def servicio_reporte_reciclaje():
    datos = listar_reporte_reciclaje()

    return datos, 200