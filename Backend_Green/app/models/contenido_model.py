from app.common.database import obtener_conexion


def crear_contenido(titulo, descripcion, tipo, url_recurso, imagen, id_usuario):
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
    INSERT INTO contenido_educativo
    (titulo, descripcion, tipo, url_recurso, imagen, id_usuario, id_estado)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    """

    datos = (titulo, descripcion, tipo, url_recurso, imagen, id_usuario, 1)

    cursor.execute(sql, datos)
    conexion.commit()

    cursor.close()
    conexion.close()


def listar_contenidos():
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = "SELECT * FROM contenido_educativo"

    cursor.execute(sql)
    datos = cursor.fetchall()

    cursor.close()
    conexion.close()

    return datos