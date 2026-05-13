from flask import Flask
from flask_cors import CORS


def crear_app():
    app = Flask(__name__)

    CORS(app)

    from app.controllers.usuarios_routes import usuarios_bp

    app.register_blueprint(usuarios_bp)

    @app.route("/")
    def inicio():
        return {
            "mensaje": "Backend GreenUp funcionando correctamente"
        }

    return app
