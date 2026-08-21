## Archivo: reportes_service.py
## Servicio de negocio: valida reglas del sistema antes de llamar a modelos.

from app.models.reportes_model import listar_reporte_reciclaje
from datetime import datetime


def _fecha_valida(valor):
    """Valida fechas con formato YYYY-MM-DD."""

    if not valor:
        return True
    try:
        datetime.strptime(valor, "%Y-%m-%d")
        return True
    except (TypeError, ValueError):
        return False


def _entero_positivo(valor):
    """Valida IDs opcionales recibidos por URL."""

    if not valor:
        return True
    try:
        return int(valor) > 0
    except (TypeError, ValueError):
        return False


def servicio_reporte_reciclaje(filtros=None):
    """
    Servicio del reporte administrativo.

    Recibe filtros opcionales desde la URL y los pasa al modelo.
    """
    filtros = filtros or {}

    if not _fecha_valida(filtros.get("fecha_inicio")):
        return {"mensaje": "La fecha inicial debe tener formato YYYY-MM-DD"}, 400

    if not _fecha_valida(filtros.get("fecha_fin")):
        return {"mensaje": "La fecha final debe tener formato YYYY-MM-DD"}, 400

    if filtros.get("fecha_inicio") and filtros.get("fecha_fin"):
        if filtros["fecha_inicio"] > filtros["fecha_fin"]:
            return {"mensaje": "La fecha inicial no puede ser mayor que la fecha final"}, 400

    for campo in ("id_usuario", "id_tipo_material", "id_punto", "id_estado"):
        if not _entero_positivo(filtros.get(campo)):
            return {"mensaje": f"El filtro {campo} debe ser un numero positivo"}, 400

    datos = listar_reporte_reciclaje(filtros)

    return datos, 200
