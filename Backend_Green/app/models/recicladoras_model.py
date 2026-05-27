# Archivo: recicladoras_model.py
# Este archivo se encarga de hablar directamente con la tabla recicladoras.
# Aqui guardamos los datos de la empresa del dueno de punto ecologico.

from app.common.database import obtener_conexion


def registrar_recicladora(id_usuario, nit_empresa, nombre_empresa, direccion_empresa, telefono_empresa, camara_comercio, id_estado):
    """
    Registra los datos de la recicladora o punto ecologico.

    id_usuario:
    Es el ID del usuario que ya fue creado en la tabla usuarios.

    nit_empresa:
    Es el identificador legal de la empresa.

    camara_comercio:
    Puede ser una ruta o nombre del archivo de camara de comercio.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
    INSERT INTO recicladoras
    (id_usuario, nit_empresa, nombre_empresa, direccion_empresa, telefono_empresa, camara_comercio, id_estado)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    """

    datos = (
        id_usuario,
        nit_empresa,
        nombre_empresa,
        direccion_empresa,
        telefono_empresa,
        camara_comercio,
        id_estado
    )

    cursor.execute(sql, datos)
    conexion.commit()

    cursor.close()
    conexion.close()


def listar_recicladoras():
    """
    Lista los duenos de recicladora con sus datos personales y datos de empresa.

    Hacemos JOIN porque:
    - usuarios tiene los datos personales.
    - recicladoras tiene los datos de la empresa.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    sql = """
    SELECT
        usuarios.id_usuario,
        usuarios.nombres,
        usuarios.apellidos,
        usuarios.correo,
        usuarios.usuario,
        usuarios.numero_documento,
        usuarios.celular,
        usuarios.fecha_registro,
        usuarios.id_estado,
        recicladoras.id_recicladora,
        recicladoras.nit_empresa,
        recicladoras.nombre_empresa,
        recicladoras.direccion_empresa,
        recicladoras.telefono_empresa,
        recicladoras.camara_comercio
    FROM usuarios
    INNER JOIN recicladoras
    ON usuarios.id_usuario = recicladoras.id_usuario
    WHERE usuarios.id_rol = 2
    """

    cursor.execute(sql)
    recicladoras = cursor.fetchall()

    cursor.close()
    conexion.close()

    return recicladoras


def buscar_recicladora_por_usuario(id_usuario):
    """
    Busca la recicladora asociada a un usuario dueno.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    sql = """
    SELECT *
    FROM recicladoras
    WHERE id_usuario = %s
    """

    cursor.execute(sql, (id_usuario,))
    recicladora = cursor.fetchone()

    cursor.close()
    conexion.close()

    return recicladora