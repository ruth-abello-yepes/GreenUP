## Archivo: __init__.py
## Inicializa la aplicacion Flask, registra blueprints y configura extensiones.

import os
from dotenv import load_dotenv

# Cargar variables de entorno desde el archivo .env
load_dotenv()

from flask import Flask, jsonify
from flask_cors import CORS
from flask_mail import Mail

from app.common.swagger import configurar_swagger

# Instancia global del correo
mail = Mail()


def _origenes_cors_permitidos():
    """
    Define desde que paginas se puede llamar al backend.

    Si el equipo necesita otro dominio en despliegue, lo agrega en .env con:
    CORS_ORIGINS=https://midominio.com,http://127.0.0.1:5502
    """

    origenes_env = os.getenv("CORS_ORIGINS")
    if origenes_env:
        return [origen.strip() for origen in origenes_env.split(",") if origen.strip()]

    return [
        "http://127.0.0.1:5500",
        "http://127.0.0.1:5501",
        "http://127.0.0.1:5502",
        "http://localhost:5500",
        "http://localhost:5501",
        "http://localhost:5502",
    ]


def crear_app():
    app = Flask(__name__)

    CORS(
        app,
        resources={r"/*": {"origins": _origenes_cors_permitidos()}},
        supports_credentials=False,
    )

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
    from app.controllers.educacion_routes import educacion_bp
    from app.controllers.comunidad_routes import comunidad_bp

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
    app.register_blueprint(educacion_bp)
    app.register_blueprint(comunidad_bp)

    # Precalienta el listado en segundo plano para acelerar la primera visita a Noticias.
    from app.services.noticias_service import iniciar_precalentamiento_cache_noticias
    iniciar_precalentamiento_cache_noticias()

    # YouTube se sincroniza en segundo plano y los resultados quedan en PostgreSQL.
    from app.services.educacion_service import iniciar_sincronizacion_educacion
    iniciar_sincronizacion_educacion()
    
    @app.route("/")
    def inicio():
        return {
            "mensaje": "Backend GreenUp funcionando correctamente"
        }

    @app.errorhandler(404)
    def error_no_encontrado(error):
        """
        Respuesta uniforme cuando una ruta no existe.

        No se retorna informacion interna del servidor.
        """

        return jsonify({"mensaje": "Recurso no encontrado"}), 404

    @app.errorhandler(405)
    def error_metodo_no_permitido(error):
        """
        Respuesta uniforme cuando la ruta existe pero el metodo HTTP no aplica.
        """

        return jsonify({"mensaje": "Metodo no permitido para esta ruta"}), 405

    @app.errorhandler(Exception)
    def error_interno(error):
        """
        Respuesta general para errores no controlados.

        El detalle se imprime en consola local, pero no se envia al frontend
        para evitar exponer datos sensibles de la aplicacion.
        """

        print(f"Error interno GreenUP: {error}")
        return jsonify({"mensaje": "Error interno del servidor"}), 500

    return app
