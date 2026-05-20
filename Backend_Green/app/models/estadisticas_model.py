# Modelo de estadísticas
# Por ahora se hacen consultas simples, sin JOIN.

from app.common.database import obtener_conexion


def total_reciclajes():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    sql = "SELECT COUNT(*) AS total_reciclajes FROM registrar_reciclaje"
    cursor.execute(sql)

    dato = cursor.fetchone()

    cursor.close()
    conexion.close()

    return dato


def total_cantidad_reciclada():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    sql = "SELECT SUM(cantidad) AS total_cantidad FROM registrar_reciclaje"
    cursor.execute(sql)

    dato = cursor.fetchone()

    cursor.close()
    conexion.close()

    return dato