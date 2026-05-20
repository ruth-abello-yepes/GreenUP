# Modelo de reportes
# Por ahora solo trae datos simples de reciclaje.

from app.common.database import obtener_conexion


def listar_reporte_reciclaje():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    sql = "SELECT * FROM registrar_reciclaje"
    cursor.execute(sql)

    datos = cursor.fetchall()

    cursor.close()
    conexion.close()

    return datos