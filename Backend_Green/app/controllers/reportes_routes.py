# Rutas de reportes

from flask import Blueprint, jsonify

from app.services.reportes_service import servicio_reporte_reciclaje


reportes_bp = Blueprint("reportes", __name__)


@reportes_bp.route("/reportes/reciclaje", methods=["GET"])
def ruta_reporte_reciclaje():
    respuesta, estado = servicio_reporte_reciclaje()
    return jsonify(respuesta), estado