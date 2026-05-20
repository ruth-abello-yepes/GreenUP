# Rutas de estadísticas

from flask import Blueprint, jsonify

from app.services.estadisticas_service import servicio_ver_estadisticas


estadisticas_bp = Blueprint("estadisticas", __name__)


@estadisticas_bp.route("/estadisticas", methods=["GET"])
def ruta_ver_estadisticas():
    respuesta, estado = servicio_ver_estadisticas()
    return jsonify(respuesta), estado