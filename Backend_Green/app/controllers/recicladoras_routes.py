## Archivo: recicladoras_routes.py
## Controlador HTTP: recibe peticiones, valida datos basicos y delega en servicios.


from io import BytesIO, StringIO

import pandas as pd
from flask import Blueprint, Response, g, jsonify, request, send_file
from psycopg2 import DatabaseError, OperationalError
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.pdfgen import canvas

from app.services.recicladoras_service import (
    servicio_actualizar_materiales_recicladora,
    servicio_actualizar_perfil_recicladora,
    servicio_actualizar_recoleccion_domicilio,
    servicio_actualizar_punto_recicladora,
    servicio_cambiar_estado_punto_recicladora,
    servicio_cambiar_estado_registro_recicladora,
    servicio_crear_novedad_recicladora,
    servicio_dashboard_recicladora,
    servicio_estadisticas_recicladora,
    servicio_listar_duenos_recicladora,
    servicio_listar_materiales_recicladora,
    servicio_listar_novedades_recicladora,
    servicio_listar_registros_recicladora,
    servicio_obtener_perfil_recicladora,
    servicio_obtener_punto_recicladora,
    servicio_registrar_dueno_recicladora,
    servicio_responder_novedad_recicladora,
    servicio_validar_documento_recicladora
)

from app.middlewares.auth_middleware import login_requerido
from app.middlewares.roles_middleware import rol_requerido


recicladoras_bp = Blueprint("recicladoras", __name__, url_prefix="/api/recicladoras")
@recicladoras_bp.route("/registro", methods=["POST"])
def ruta_registrar_dueno_recicladora():
    """
    Registrar dueno de punto ecologico
    ---
    tags:
      - Recicladoras
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - nombres
            - apellidos
            - correo
            - usuario
            - contrasena
            - numero_documento
            - id_tipo_documento
            - nit_empresa
            - nombre_empresa
            - direccion_empresa
          properties:
            nombres:
              type: string
              example: Ruth Mery
            apellidos:
              type: string
              example: Abello Yepes
            correo:
              type: string
              example: ruth@gmail.com
            usuario:
              type: string
              example: ruthrecicladora
            contrasena:
              type: string
              example: "GreenUp2026!"
            numero_documento:
              type: string
              example: "1234567890"
            celular:
              type: string
              example: "3001234567"
            foto_perfil:
              type: string
              example: ""
            id_tipo_documento:
              type: integer
              example: 1
            nit_empresa:
              type: string
              example: "900123456-1"
            nombre_empresa:
              type: string
              example: Punto Verde Ruth
            direccion_empresa:
              type: string
              example: Calle 10 # 15-20
            telefono_empresa:
              type: string
              example: "6051234567"
            camara_comercio:
              type: string
              example: camara_ruth.pdf
    responses:
      201:
        description: Dueno de punto ecologico registrado correctamente
      400:
        description: Faltan datos obligatorios
    """

    datos = request.get_json() or {}

    try:
        respuesta, estado = servicio_registrar_dueno_recicladora(datos)
    except (OperationalError, DatabaseError) as error:
        print(f"Error de base de datos en registro recicladora GreenUP: {error}")
        return jsonify({
            "mensaje": "Base de datos no disponible. Revisa la conexion de Render con Supabase."
        }), 503

    return jsonify(respuesta), estado
@recicladoras_bp.route("/listar", methods=["GET"])
@login_requerido
@rol_requerido([1])
def ruta_listar_duenos_recicladora():
    """
    Listar duenos de punto ecologico
    ---
    tags:
      - Recicladoras
    responses:
      200:
        description: Lista de duenos de punto ecologico
      401:
        description: No ha iniciado sesion
      403:
        description: No tiene permisos
    """

    try:
        respuesta, estado = servicio_listar_duenos_recicladora()
    except (OperationalError, DatabaseError) as error:
        print(f"Error de base de datos al listar recicladoras GreenUP: {error}")
        return jsonify({
            "mensaje": "No se pudieron cargar las recicladoras. Revisa la conexion con Supabase."
        }), 503

    return jsonify(respuesta), estado


@recicladoras_bp.route("/<int:id_usuario>/validacion", methods=["PUT"])
@login_requerido
@rol_requerido([1])
def ruta_validar_documento_recicladora(id_usuario):
    datos = request.get_json() or {}
    respuesta, estado = servicio_validar_documento_recicladora(id_usuario, datos)
    return jsonify(respuesta), estado


@recicladoras_bp.route("/perfil", methods=["GET"])
@login_requerido
@rol_requerido([2])
def ruta_obtener_perfil_recicladora():
    """
    Perfil de la recicladora autenticada.
    ---
    tags:
      - Recicladoras
    responses:
      200:
        description: Datos reales del dueno y su recicladora
      401:
        description: No ha iniciado sesion
      403:
        description: No tiene permisos
      404:
        description: No hay recicladora asociada
    """

    respuesta, estado = servicio_obtener_perfil_recicladora(g.id_usuario)

    return jsonify(respuesta), estado
@recicladoras_bp.route("/perfil", methods=["PUT"])
@login_requerido
@rol_requerido([2])
def ruta_actualizar_perfil_recicladora():
    datos = request.get_json() or {}
    respuesta, estado = servicio_actualizar_perfil_recicladora(g.id_usuario, datos)
    return jsonify(respuesta), estado


@recicladoras_bp.route("/recoleccion-domicilio", methods=["PUT"])
@login_requerido
@rol_requerido([2])
def ruta_actualizar_recoleccion_domicilio():
    respuesta, estado = servicio_actualizar_recoleccion_domicilio(
        g.id_usuario, request.get_json() or {}
    )
    return jsonify(respuesta), estado
@recicladoras_bp.route("/mi-punto", methods=["GET"])
@login_requerido
@rol_requerido([2])
def ruta_obtener_punto_recicladora():
    respuesta, estado = servicio_obtener_punto_recicladora(g.id_usuario)
    return jsonify(respuesta), estado


@recicladoras_bp.route("/mi-punto", methods=["PUT"])
@login_requerido
@rol_requerido([2])
def ruta_actualizar_punto_recicladora():
    datos = request.get_json() or {}
    respuesta, estado = servicio_actualizar_punto_recicladora(g.id_usuario, datos)
    return jsonify(respuesta), estado


@recicladoras_bp.route("/mi-punto/estado", methods=["PUT"])
@login_requerido
@rol_requerido([2])
def ruta_cambiar_estado_punto_recicladora():
    datos = request.get_json() or {}
    respuesta, estado = servicio_cambiar_estado_punto_recicladora(g.id_usuario, datos)
    return jsonify(respuesta), estado
@recicladoras_bp.route("/registros", methods=["GET"])
@login_requerido
@rol_requerido([2])
def ruta_listar_registros_recicladora():
    respuesta, estado = servicio_listar_registros_recicladora(
        g.id_usuario,
        request.args.get("fecha_inicio"),
        request.args.get("fecha_fin"),
    )
    return jsonify(respuesta), estado


@recicladoras_bp.route("/registros/<int:id_registro>/estado", methods=["PUT"])
@login_requerido
@rol_requerido([2])
def ruta_cambiar_estado_registro_recicladora(id_registro):
    datos = request.get_json() or {}
    respuesta, estado = servicio_cambiar_estado_registro_recicladora(g.id_usuario, id_registro, datos)
    return jsonify(respuesta), estado
@recicladoras_bp.route("/materiales", methods=["GET"])
@login_requerido
@rol_requerido([2])
def ruta_listar_materiales_recicladora():
    respuesta, estado = servicio_listar_materiales_recicladora(g.id_usuario)
    return jsonify(respuesta), estado


@recicladoras_bp.route("/materiales", methods=["PUT"])
@login_requerido
@rol_requerido([2])
def ruta_actualizar_materiales_recicladora():
    datos = request.get_json() or {}
    respuesta, estado = servicio_actualizar_materiales_recicladora(g.id_usuario, datos)
    return jsonify(respuesta), estado
@recicladoras_bp.route("/novedades", methods=["GET"])
@login_requerido
@rol_requerido([2])
def ruta_listar_novedades_recicladora():
    respuesta, estado = servicio_listar_novedades_recicladora(g.id_usuario)
    return jsonify(respuesta), estado


@recicladoras_bp.route("/novedades", methods=["POST"])
@login_requerido
@rol_requerido([2])
def ruta_crear_novedad_recicladora():
    datos = request.get_json() or {}
    respuesta, estado = servicio_crear_novedad_recicladora(g.id_usuario, datos)
    return jsonify(respuesta), estado


@recicladoras_bp.route("/novedades/<int:id_novedad>", methods=["PUT"])
@login_requerido
@rol_requerido([2])
def ruta_responder_novedad_recicladora(id_novedad):
    datos = request.get_json() or {}
    respuesta, estado = servicio_responder_novedad_recicladora(g.id_usuario, id_novedad, datos)
    return jsonify(respuesta), estado
@recicladoras_bp.route("/estadisticas", methods=["GET"])
@login_requerido
@rol_requerido([2])
def ruta_estadisticas_recicladora():
    respuesta, estado = servicio_estadisticas_recicladora(
        g.id_usuario,
        request.args.get("fecha_inicio"),
        request.args.get("fecha_fin"),
    )
    return jsonify(respuesta), estado


@recicladoras_bp.route("/reportes", methods=["GET"])
@login_requerido
@rol_requerido([2])
def ruta_reportes_recicladora():
    fecha_inicio = request.args.get("fecha_inicio")
    fecha_fin = request.args.get("fecha_fin")
    formato = (request.args.get("formato") or "json").lower()
    registros, estado = servicio_listar_registros_recicladora(g.id_usuario, fecha_inicio, fecha_fin)

    if formato == "json":
        return jsonify(registros), estado

    filas = []
    for item in registros:
        filas.append({
            "ID": item.get("id_registro"),
            "Fecha": item.get("fecha_hora"),
            "Usuario": item.get("usuario"),
            "Material": item.get("material"),
            "Cantidad kg": item.get("cantidad"),
            "Puntos": item.get("puntos_obtenidos"),
            "Estado": item.get("estado"),
            "Observaciones": item.get("observaciones"),
        })

    dataframe = pd.DataFrame(filas)
    if formato == "csv":
        salida = StringIO()
        dataframe.to_csv(salida, index=False)
        return Response(
            salida.getvalue(),
            mimetype="text/csv",
            headers={"Content-Disposition": "attachment; filename=reporte_recicladora.csv"},
        )
    if formato in ("excel", "xlsx"):
        salida = BytesIO()
        with pd.ExcelWriter(salida, engine="openpyxl") as writer:
            dataframe.to_excel(writer, index=False, sheet_name="Reporte")
        salida.seek(0)
        return send_file(
            salida,
            as_attachment=True,
            download_name="reporte_recicladora.xlsx",
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
    if formato == "pdf":
        salida = BytesIO()
        pdf = SimpleDocTemplate(salida, pagesize=letter, rightMargin=34, leftMargin=34, topMargin=34, bottomMargin=34)
        estilos = getSampleStyleSheet()
        titulo = ParagraphStyle("TituloGreenUp", parent=estilos["Title"], fontName="Helvetica-Bold", fontSize=19, textColor=colors.HexColor("#063b68"), alignment=TA_LEFT, spaceAfter=4)
        subtitulo = ParagraphStyle("SubtituloGreenUp", parent=estilos["Normal"], fontSize=9, textColor=colors.HexColor("#526477"), spaceAfter=16)
        celda = ParagraphStyle("CeldaGreenUp", parent=estilos["Normal"], fontSize=8, leading=10, textColor=colors.HexColor("#23384d"))
        cabecera = ParagraphStyle("CabeceraGreenUp", parent=celda, textColor=colors.white)
        encabezado = [Paragraph(f"<b>{nombre}</b>", cabecera) for nombre in ("ID", "Fecha", "Usuario", "Material", "Cantidad", "Puntos", "Estado")]
        datos = [encabezado]
        for fila in filas:
            datos.append([Paragraph(str(fila.get(clave) or "-"), celda) for clave in ("ID", "Fecha", "Usuario", "Material", "Cantidad kg", "Puntos", "Estado")])
        tabla = Table(datos, colWidths=[30, 76, 105, 105, 53, 43, 58], repeatRows=1)
        tabla.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#063b68")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#d9e4eb")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f2f8f5")]),
            ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ]))
        elementos = [Paragraph("GreenUp", titulo), Paragraph("Reporte de recicladora", subtitulo), tabla]
        pdf.build(elementos)
        salida.seek(0)
        return send_file(
            salida,
            as_attachment=True,
            download_name="reporte_recicladora.pdf",
            mimetype="application/pdf",
        )

    return jsonify({"mensaje": "Formato no soportado. Usa json, csv, excel o pdf"}), 400
@recicladoras_bp.route("/dashboard", methods=["GET"])
@login_requerido
@rol_requerido([2])
def ruta_dashboard_recicladora():
    """
    Dashboard real del dueno de recicladora.
    """

    respuesta, estado = servicio_dashboard_recicladora(g.id_usuario)

    return jsonify(respuesta), estado
