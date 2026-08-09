## Archivo: reportes_routes.py
## Controlador HTTP: recibe peticiones, valida datos basicos y delega en servicios.

from flask import Blueprint, jsonify, request

from app.services.reportes_service import servicio_reporte_reciclaje


reportes_bp = Blueprint("reportes", __name__)


@reportes_bp.route("/reportes/reciclaje", methods=["GET"])
def ruta_reporte_reciclaje():
    """
    Reporte de reciclaje para el administrador.

    Filtros opcionales:
    - fecha_inicio
    - fecha_fin
    - id_usuario
    - id_tipo_material
    - id_punto
    - id_estado
    """
    filtros = {
        "fecha_inicio": request.args.get("fecha_inicio"),
        "fecha_fin": request.args.get("fecha_fin"),
        "id_usuario": request.args.get("id_usuario"),
        "id_tipo_material": request.args.get("id_tipo_material"),
        "id_punto": request.args.get("id_punto"),
        "id_estado": request.args.get("id_estado"),
    }

    respuesta, estado = servicio_reporte_reciclaje(filtros)
    return jsonify(respuesta), estado
