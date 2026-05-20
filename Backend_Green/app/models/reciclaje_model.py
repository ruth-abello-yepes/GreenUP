# Modelo de puntos de reciclaje

from app.common.database import obtener_conexion


def crear_ubicacion(nombre, direccion, horario):
    
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
        INSERT INTO puntos_reciclaje
        (nombre, direccion, horario)
        VALUES (%s, %s, %s)
    """

    cursor.execute(sql, (nombre, direccion, horario))
    conexion.commit()

    cursor.close()
    conexion.close()


def listar_ubicaciones():

    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    cursor.execute("SELECT * FROM puntos_reciclaje")

    data = cursor.fetchall()

    cursor.close()
    conexion.close()

    return data# Modelo de puntos de reciclaje

from app.common.database import obtener_conexion


def crear_ubicacion(nombre, direccion, horario):
    
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
        INSERT INTO puntos_reciclaje
        (nombre, direccion, horario)
        VALUES (%s, %s, %s)
    """

    cursor.execute(sql, (nombre, direccion, horario))
    conexion.commit()

    cursor.close()
    conexion.close()


def listar_ubicaciones():

    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    cursor.execute("SELECT * FROM puntos_reciclaje")

    data = cursor.fetchall()

    cursor.close()
    conexion.close()

    return data