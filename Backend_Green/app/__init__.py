## Archivo: __init__.py
## Inicializa la aplicacion Flask, registra blueprints y configura extensiones.

import os
import traceback
from dotenv import load_dotenv

# Cargar variables de entorno desde el archivo .env
load_dotenv()

from flask import Flask, jsonify, request
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

    origenes_base = [
        "http://127.0.0.1:5500",
        "http://127.0.0.1:5501",
        "http://127.0.0.1:5502",
        "http://localhost:5500",
        "http://localhost:5501",
        "http://localhost:5502",
        "https://greenupgrup.netlify.app",
        "https://green-up-eta.vercel.app",
        "https://greenup-hoxj.onrender.com",
        "https://ruth-abello-yepes.github.io",
    ]
    origenes_env = [
        origen.strip()
        for origen in os.getenv("CORS_ORIGINS", "").split(",")
        if origen.strip()
    ]

    return sorted(set(origenes_base + origenes_env))


def crear_app():
    app = Flask(__name__)
    origenes_permitidos = _origenes_cors_permitidos()

    CORS(
        app,
        resources={r"/*": {"origins": origenes_permitidos}},
        supports_credentials=False,
    )

    @app.after_request
    def agregar_cors_a_todas_las_respuestas(respuesta):
        origen = request.headers.get("Origin")
        if origen in origenes_permitidos:
            respuesta.headers["Access-Control-Allow-Origin"] = origen
            respuesta.headers["Vary"] = "Origin"
            respuesta.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            respuesta.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        return respuesta

    # Permitir hasta 2 MB en el body (necesario para fotos de perfil en base64)
    app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024

    # Configuración del servidor de correo SMTP (Gmail)
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', '587'))
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'
    app.config['MAIL_USE_SSL'] = os.getenv('MAIL_USE_SSL', 'false').lower() == 'true'
    app.config['MAIL_TIMEOUT'] = int(os.getenv('MAIL_TIMEOUT', '20'))
    mail_username = (
        os.getenv('MAIL_USERNAME')
        or os.getenv('SMTP_USERNAME')
        or os.getenv('EMAIL_USER')
        or os.getenv('GMAIL_USER')
    )
    mail_password = (
        os.getenv('MAIL_PASSWORD')
        or os.getenv('SMTP_PASSWORD')
        or os.getenv('EMAIL_PASSWORD')
        or os.getenv('GMAIL_APP_PASSWORD')
        or os.getenv('GMAIL_PASSWORD')
    )
    app.config['MAIL_USERNAME'] = mail_username
    app.config['MAIL_PASSWORD'] = mail_password
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER') or mail_username

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

    def _comprobar_base_datos():
        """
        Verifica conexión real con PostgreSQL/Supabase sin exponer credenciales.
        Sirve para confirmar rápidamente Render + base de datos.
        """

        from app.common.database import obtener_conexion

        try:
            conexion = obtener_conexion()
            cursor = conexion.cursor()
            cursor.execute("SELECT 1 AS ok")
            cursor.fetchone()
            cursor.close()
            conexion.close()
            return True, "Base de datos conectada", 200
        except Exception as error:
            print(f"Error de conexión a base de datos GreenUP: {error}")
            return False, "Base de datos no disponible", 503

    @app.route("/health")
    def salud_general():
        """
        Diagnóstico general para despliegue.
        No expone variables, claves, usuarios ni contraseñas.
        """

        base_ok, mensaje_base, estado_base = _comprobar_base_datos()
        estado_http = 200 if base_ok else 503
        return jsonify({
            "backend": "ok",
            "database": "ok" if base_ok else "error",
            "ok": base_ok,
            "mensaje": "GreenUp operativo" if base_ok else mensaje_base,
        }), estado_http

    @app.route("/health/db")
    def salud_base_datos():
        base_ok, mensaje_base, estado_base = _comprobar_base_datos()
        return jsonify({"ok": base_ok, "mensaje": mensaje_base}), estado_base

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
        traceback.print_exc()
        return jsonify({"mensaje": "Error interno del servidor"}), 500

    return app
