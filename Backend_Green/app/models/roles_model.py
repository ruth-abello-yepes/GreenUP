from app.common.database import obtener_conexion


def registrar_rol(nombre, descripcion, id_estado):
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
    INSERT INTO roles (nombre, descripcion, id_estado)
    VALUES (%s, %s, %s)
    """

    datos = (nombre, descripcion, id_estado)

    cursor.execute(sql, datos)
    conexion.commit()

    cursor.close()
    conexion.close()


def listar_roles():
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = "SELECT * FROM roles"

    cursor.execute(sql)
    roles = cursor.fetchall()

    cursor.close()
    conexion.close()

    return roles


def buscar_rol_por_id(id_rol):
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = "SELECT * FROM roles WHERE id_rol = %s"

    cursor.execute(sql, (id_rol,))
    rol = cursor.fetchone()

    cursor.close()
    conexion.close()

    return rol


def actualizar_rol(id_rol, nombre, descripcion, id_estado):
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
    UPDATE roles
    SET nombre = %s,
        descripcion = %s,
        id_estado = %s
    WHERE id_rol = %s
    """

    datos = (nombre, descripcion, id_estado, id_rol)

    cursor.execute(sql, datos)
    conexion.commit()

    cursor.close()
    conexion.close()


def inhabilitar_rol(id_rol):
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = "UPDATE roles SET id_estado = 2 WHERE id_rol = %s"

    cursor.execute(sql, (id_rol,))
    conexion.commit()

    cursor.close()
    conexion.close()
