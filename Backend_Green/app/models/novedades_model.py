# Modelo de novedades

from app.common.database import obtener_conexion


def crear_novedad(titulo, descripcion, imagen, id_usuario):
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
        INSERT INTO novedades
        (titulo, descripcion, imagen, id_usuario, id_estado)
        VALUES (%s, %s, %s, %s, 1)
    """

    cursor.execute(sql, (titulo, descripcion, imagen, id_usuario))
    conexion.commit()

    cursor.close()
    conexion.close()


def listar_novedades():
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    cursor.execute("SELECT * FROM novedades")
    datos = cursor.fetchall()

    cursor.close()
    conexion.close()

    return datos


def buscar_novedad(id_novedad):
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = "SELECT * FROM novedades WHERE id_novedad = %s"
    cursor.execute(sql, (id_novedad,))

    dato = cursor.fetchone()

    cursor.close()
    conexion.close()

    return dato


def cambiar_estado_novedad(id_novedad, id_estado):
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
        UPDATE novedades
        SET id_estado = %s
        WHERE id_novedad = %s
    """

    cursor.execute(sql, (id_estado, id_novedad))
    conexion.commit()

    cursor.close()
    conexion.close()