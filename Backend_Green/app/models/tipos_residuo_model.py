# Modelo de tipos de residuo
# Aquí van las consultas SQL directas, sin ORM.

from app.common.database import obtener_conexion

def crear_tipo_residuo(nombre, descripcion, color_contenedor):
    """Crea un nuevo tipo de residuo."""

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
        INSERT INTO tipo_residuo
        (nombre, descripcion, color_contenedor, id_estado)
        VALUES (%s, %s, %s, 1)
    """

    cursor.execute(sql, (nombre, descripcion, color_contenedor))
    conexion.commit()

    cursor.close()
    conexion.close()


def listar_tipos_residuo():
    """Lista todos los tipos de residuo."""

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    cursor.execute("SELECT * FROM tipo_residuo")
    datos = cursor.fetchall()

    cursor.close()
    conexion.close()

    return datos


def buscar_tipo_residuo(id_tipo_residuo):
    """Busca un tipo de residuo por ID."""

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = "SELECT * FROM tipo_residuo WHERE id_tipo_residuo = %s"
    cursor.execute(sql, (id_tipo_residuo,))

    dato = cursor.fetchone()

    cursor.close()
    conexion.close()

    return dato


def editar_tipo_residuo(id_tipo_residuo, nombre, descripcion, color_contenedor):
    """Edita un tipo de residuo."""

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
        UPDATE tipo_residuo
        SET nombre = %s,
            descripcion = %s,
            color_contenedor = %s
        WHERE id_tipo_residuo = %s
    """

    cursor.execute(sql, (nombre, descripcion, color_contenedor, id_tipo_residuo))
    conexion.commit()

    cursor.close()
    conexion.close()


def cambiar_estado_tipo_residuo(id_tipo_residuo, id_estado):
    """Activa o inactiva un tipo de residuo."""

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
        UPDATE tipo_residuo
        SET id_estado = %s
        WHERE id_tipo_residuo = %s
    """

    cursor.execute(sql, (id_estado, id_tipo_residuo))
    conexion.commit()

    cursor.close()
    conexion.close()