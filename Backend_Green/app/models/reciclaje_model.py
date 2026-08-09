## Archivo: reciclaje_model.py
## Modelo de datos: contiene consultas SQL y operaciones directas con la base de datos.

from app.common.database import obtener_conexion


def crear_reciclaje(cantidad, observaciones, id_usuario, id_tipo_material, id_punto):
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
    INSERT INTO registrar_reciclaje
    (cantidad, observaciones, id_usuario, id_tipo_material, id_punto, id_estado)
    VALUES (%s, %s, %s, %s, %s, %s)
    """

    datos = (cantidad, observaciones, id_usuario, id_tipo_material, id_punto, 1)

    cursor.execute(sql, datos)
    conexion.commit()

    cursor.close()
    conexion.close()


def listar_reciclajes():
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = "SELECT * FROM registrar_reciclaje"

    cursor.execute(sql)
    datos = cursor.fetchall()

    cursor.close()
    conexion.close()

    return datos


def buscar_reciclaje(id_registro):
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = "SELECT * FROM registrar_reciclaje WHERE id_registro = %s"

    cursor.execute(sql, (id_registro,))
    dato = cursor.fetchone()

    cursor.close()
    conexion.close()

    return dato


def cambiar_estado_reciclaje(id_registro, id_estado):
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
    UPDATE registrar_reciclaje
    SET id_estado = %s
    WHERE id_registro = %s
    """

    cursor.execute(sql, (id_estado, id_registro))
    conexion.commit()

    cursor.close()
    conexion.close()