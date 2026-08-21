## Archivo: reportes_routes.py
## Controlador HTTP: recibe peticiones, valida datos basicos y delega en servicios.

from io import BytesIO, StringIO

import pandas as pd
from flask import Blueprint, Response, jsonify, request, send_file
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from app.services.reportes_service import servicio_reporte_reciclaje
from app.middlewares.auth_middleware import login_requerido
from app.middlewares.roles_middleware import rol_requerido


reportes_bp = Blueprint("reportes", __name__)


@reportes_bp.route("/reportes/reciclaje", methods=["GET"])
@login_requerido
@rol_requerido([1])
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

    formato = (request.args.get("formato") or "json").lower()
    respuesta, estado = servicio_reporte_reciclaje(filtros)

    if estado != 200:
        return jsonify(respuesta), estado

    if formato == "json":
        return jsonify(respuesta), estado

    filas = []
    for item in respuesta:
        filas.append({
            "ID": item.get("id_registro"),
            "Fecha": item.get("fecha_hora"),
            "Ciudadano": item.get("usuario_nombre") or item.get("usuario"),
            "Material": item.get("material"),
            "Residuo": item.get("residuo"),
            "Punto": item.get("punto"),
            "Cantidad": item.get("cantidad"),
            "Puntos": item.get("puntos_obtenidos"),
            "Estado": item.get("estado"),
        })

    dataframe = pd.DataFrame(filas)

    if formato == "csv":
        salida = StringIO()
        dataframe.to_csv(salida, index=False)
        return Response(
            salida.getvalue(),
            mimetype="text/csv",
            headers={"Content-Disposition": "attachment; filename=reporte_reciclaje_greenup.csv"},
        )

    if formato in ("excel", "xlsx"):
        salida = BytesIO()
        with pd.ExcelWriter(salida, engine="openpyxl") as writer:
            dataframe.to_excel(writer, index=False, sheet_name="Reciclaje")
        salida.seek(0)
        return send_file(
            salida,
            as_attachment=True,
            download_name="reporte_reciclaje_greenup.xlsx",
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

    if formato == "pdf":
        salida = BytesIO()
        pdf = canvas.Canvas(salida, pagesize=letter)
        ancho, alto = letter
        y = alto - 48
        pdf.setFont("Helvetica-Bold", 14)
        pdf.drawString(48, y, "Reporte administrativo de reciclaje GreenUp")
        y -= 26
        pdf.setFont("Helvetica", 9)

        if not filas:
            pdf.drawString(48, y, "No hay registros con los filtros seleccionados.")
        for fila in filas[:80]:
            texto = (
                f"{fila['ID']} | {fila['Fecha']} | {fila['Ciudadano']} | "
                f"{fila['Material']} | {fila['Cantidad']} kg | {fila['Estado']}"
            )
            pdf.drawString(48, y, texto[:120])
            y -= 16
            if y < 48:
                pdf.showPage()
                pdf.setFont("Helvetica", 9)
                y = alto - 48

        pdf.save()
        salida.seek(0)
        return send_file(
            salida,
            as_attachment=True,
            download_name="reporte_reciclaje_greenup.pdf",
            mimetype="application/pdf",
        )

    return jsonify({"mensaje": "Formato no soportado. Usa json, csv, excel o pdf"}), 400
