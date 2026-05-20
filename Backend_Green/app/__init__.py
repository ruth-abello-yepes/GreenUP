from flask import Flask
from flask_cors import CORS

from app.common.swagger import configurar_swagger
from app.controllers.usuarios_routes import usuarios_bp
from app.controllers.tipo_documento_routes import tipo_documento_bp
from app.controllers.roles_routes import roles_bp
from app.controllers.auth_routes import auth_bp
from app.controllers.ubicaciones_routes import ubicaciones_bp
from app.controllers.reciclaje_routes import reciclaje_bp
from app.controllers.novedades_routes import novedades_bp
from app.controllers.contenido_routes import contenido_bp
from app.controllers.faq_routes import faq_bp
from app.controllers.estadisticas_routes import estadisticas_bp
from app.controllers.reportes_routes import reportes_bp


def crear_app():
    app = Flask(__name__)

    CORS(app)

    configurar_swagger(app)

    app.register_blueprint(usuarios_bp)
    app.register_blueprint(tipo_documento_bp)
    app.register_blueprint(roles_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(ubicaciones_bp)
    app.register_blueprint(reciclaje_bp)
    app.register_blueprint(novedades_bp)
    app.register_blueprint(contenido_bp)
    app.register_blueprint(faq_bp)
    app.register_blueprint(estadisticas_bp)
    app.register_blueprint(reportes_bp)
    
    
    
    @app.route("/")
    def inicio():
        return {
            "mensaje": "Backend GreenUp funcionando correctamente"
        }

    return app
