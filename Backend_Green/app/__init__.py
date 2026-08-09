## Archivo: __init__.py
## Inicializa la aplicacion Flask, registra blueprints y configura extensiones.

import os
from dotenv import load_dotenv

# Cargar variables de entorno desde el archivo .env
load_dotenv()

from flask import Flask
from flask_cors import CORS
from flask_mail import Mail

from app.common.swagger import configurar_swagger

# Instancia global del correo
mail = Mail()


def crear_app():
    app = Flask(__name__)

    CORS(app)

    # Configuración del servidor de correo SMTP (Gmail)
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USE_SSL'] = False
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_USERNAME')

    # Inicializamos la extensión de correo
    mail.init_app(app)

    configurar_swagger(app)

    # Importamos los Blueprints AQUÍ adentro para evitar importaciones circulares
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
    from app.controllers.materiales_routes import materiales_bp
    from app.controllers.tipos_residuo_routes import tipos_residuo_bp
    from app.controllers.recicladoras_routes import recicladoras_bp
    from app.controllers.notificaciones_routes import notificaciones_bp
    from app.controllers.noticias_routes import noticias_bp

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
    app.register_blueprint(materiales_bp)
    app.register_blueprint(tipos_residuo_bp)
    app.register_blueprint(recicladoras_bp)
    app.register_blueprint(notificaciones_bp)
    app.register_blueprint(noticias_bp)
    
    @app.route("/")
    def inicio():
        return {
            "mensaje": "Backend GreenUp funcionando correctamente"
        }

    return app
