## Archivo: reportes_model.py
## Modelo de datos: contiene consultas SQL y operaciones directas con la base de datos.

from app.common.database import obtener_conexion


def listar_reporte_reciclaje(filtros=None):
    """
    Reporte administrativo de reciclaje.

    Esta consulta une varias tablas para que el administrador no vea solo IDs.
    Tambien recibe filtros opcionales enviados desde admin_reportes.html.
    """
    filtros = filtros or {}
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    condiciones = []
    valores = []

    if filtros.get("fecha_inicio"):
        condiciones.append("registrar_reciclaje.fecha_hora::date >= %s")
        valores.append(filtros["fecha_inicio"])

    if filtros.get("fecha_fin"):
        condiciones.append("registrar_reciclaje.fecha_hora::date <= %s")
        valores.append(filtros["fecha_fin"])

    if filtros.get("id_usuario"):
        condiciones.append("registrar_reciclaje.id_usuario = %s")
        valores.append(filtros["id_usuario"])

    if filtros.get("id_tipo_material"):
        condiciones.append("registrar_reciclaje.id_tipo_material = %s")
        valores.append(filtros["id_tipo_material"])

    if filtros.get("id_punto"):
        condiciones.append("registrar_reciclaje.id_punto = %s")
        valores.append(filtros["id_punto"])

    if filtros.get("id_estado"):
        condiciones.append("registrar_reciclaje.id_estado = %s")
        valores.append(filtros["id_estado"])

    where_sql = ""
    if condiciones:
        where_sql = "WHERE " + " AND ".join(condiciones)

    sql = f"""
        SELECT
            registrar_reciclaje.id_registro,
            registrar_reciclaje.cantidad,
            registrar_reciclaje.puntos_obtenidos,
            registrar_reciclaje.observaciones,
            registrar_reciclaje.fecha_hora,
            registrar_reciclaje.id_estado,
            estado.descripcion AS estado,
            usuarios.id_usuario,
            CONCAT(usuarios.nombres, ' ', usuarios.apellidos) AS usuario_nombre,
            usuarios.usuario,
            tipo_material.id_tipo_material,
            tipo_material.nombre AS material,
            tipo_material.unidad,
            tipo_residuo.nombre AS residuo,
            puntos_reciclaje.id_punto,
            puntos_reciclaje.nombre AS punto,
            puntos_reciclaje.direccion AS direccion_punto
        FROM registrar_reciclaje
        LEFT JOIN usuarios
            ON registrar_reciclaje.id_usuario = usuarios.id_usuario
        LEFT JOIN tipo_material
            ON registrar_reciclaje.id_tipo_material = tipo_material.id_tipo_material
        LEFT JOIN tipo_residuo
            ON tipo_material.id_tipo_residuo = tipo_residuo.id_tipo_residuo
        LEFT JOIN puntos_reciclaje
            ON registrar_reciclaje.id_punto = puntos_reciclaje.id_punto
        LEFT JOIN estado
            ON registrar_reciclaje.id_estado = estado.id_estado
        {where_sql}
        ORDER BY registrar_reciclaje.fecha_hora DESC
    """

    cursor.execute(sql, tuple(valores))

    datos = cursor.fetchall()

    cursor.close()
    conexion.close()

    return datos
