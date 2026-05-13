from app.common.database import obtener_conexion


def registrar_tipo_documento(descripcion, id_estado):
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
    INSERT INTO tipo_documento (descripcion, id_estado)
    VALUES (%s, %s)
    """

    datos = (descripcion, id_estado)

    cursor.execute(sql, datos)
    conexion.commit()

    cursor.close()
    conexion.close()


def listar_tipos_documento():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    sql = "SELECT * FROM tipo_documento"

    cursor.execute(sql)
    tipos_documento = cursor.fetchall()

    cursor.close()
    conexion.close()

    return tipos_documento


def buscar_tipo_documento_por_id(id_tipo_documento):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    sql = "SELECT * FROM tipo_documento WHERE id_tipo_documento = %s"

    cursor.execute(sql, (id_tipo_documento,))
    tipo_documento = cursor.fetchone()

    cursor.close()
    conexion.close()

    return tipo_documento


def actualizar_tipo_documento(id_tipo_documento, descripcion, id_estado):
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
    UPDATE tipo_documento
    SET descripcion = %s,
        id_estado = %s
    WHERE id_tipo_documento = %s
    """

    datos = (descripcion, id_estado, id_tipo_documento)

    cursor.execute(sql, datos)
    conexion.commit()

    cursor.close()
    conexion.close()


def inhabilitar_tipo_documento(id_tipo_documento):
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = "UPDATE tipo_documento SET id_estado = 2 WHERE id_tipo_documento = %s"

    cursor.execute(sql, (id_tipo_documento,))
    conexion.commit()

    cursor.close()
    conexion.close()
