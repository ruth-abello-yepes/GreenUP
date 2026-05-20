from app.models.reportes_model import listar_reporte_reciclaje


def servicio_reporte_reciclaje():
    datos = listar_reporte_reciclaje()

    return datos, 200