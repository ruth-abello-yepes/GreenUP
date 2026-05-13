from flask import Blueprint, request, jsonify
from app.services.auth_service import servicio_login


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def ruta_login():
    datos = request.get_json()

    respuesta, estado = servicio_login(datos)

    return jsonify(respuesta), estado
