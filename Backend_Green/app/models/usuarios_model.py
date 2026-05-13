from app.common.database import obtener_conexion


def registrar_usuario(nombres, apellidos, correo, usuario, contrasena, numero_documento, celular, foto_perfil, id_tipo_documento, id_rol, id_estado):
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
    INSERT INTO usuarios
    (nombres, apellidos, correo, usuario, contrasena, numero_documento, celular, foto_perfil, id_tipo_documento, id_rol, id_estado)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    datos = (nombres, apellidos, correo, usuario, contrasena, numero_documento, celular, foto_perfil, id_tipo_documento, id_rol, id_estado)

    cursor.execute(sql, datos)
    conexion.commit()

    cursor.close()
    conexion.close()


def listar_usuarios():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    sql = "SELECT * FROM usuarios"

    cursor.execute(sql)
    usuarios = cursor.fetchall()

    cursor.close()
    conexion.close()

    return usuarios


def buscar_usuario_por_id(id_usuario):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    sql = "SELECT * FROM usuarios WHERE id_usuario = %s"

    cursor.execute(sql, (id_usuario,))
    usuario = cursor.fetchone()

    cursor.close()
    conexion.close()

    return usuario


def actualizar_usuario(id_usuario, nombres, apellidos, correo, usuario, numero_documento, celular, foto_perfil, id_tipo_documento, id_rol, id_estado):
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
    UPDATE usuarios
    SET nombres = %s,
        apellidos = %s,
        correo = %s,
        usuario = %s,
        numero_documento = %s,
        celular = %s,
        foto_perfil = %s,
        id_tipo_documento = %s,
        id_rol = %s,
        id_estado = %s
    WHERE id_usuario = %s
    """

    datos = (nombres, apellidos, correo, usuario, numero_documento, celular, foto_perfil, id_tipo_documento, id_rol, id_estado, id_usuario)

    cursor.execute(sql, datos)
    conexion.commit()

    cursor.close()
    conexion.close()


def inhabilitar_usuario(id_usuario):
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = "UPDATE usuarios SET id_estado = 2 WHERE id_usuario = %s"

    cursor.execute(sql, (id_usuario,))
    conexion.commit()

    cursor.close()
    conexion.close()

def buscar_usuario_por_usuario(usuario):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    sql = "SELECT * FROM usuarios WHERE usuario = %s"

    cursor.execute(sql, (usuario,))
    usuario_encontrado = cursor.fetchone()

    cursor.close()
    conexion.close()

    return usuario_encontrado
