from app.models.reportes_model import listar_reporte_reciclaje


def servicio_reporte_reciclaje(filtros=None):
    """
    Servicio del reporte administrativo.

    Recibe filtros opcionales desde la URL y los pasa al modelo.
    """
    datos = listar_reporte_reciclaje(filtros)

    return datos, 200
