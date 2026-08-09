## Archivo: materiales_model.py
## Modelo de datos: contiene consultas SQL y operaciones directas con la base de datos.

# Modelo de materiales
# Aquí van las consultas directas a la base de datos, sin ORM.

from app.common.database import obtener_conexion


def crear_material(nombre, descripcion, unidad, puntos_por_kg, id_tipo_residuo):
    """
    Crea un nuevo material reciclable.
    """
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
        INSERT INTO tipo_material 
        (nombre, descripcion, unidad, puntos_por_kg, id_tipo_residuo, id_estado)
        VALUES (%s, %s, %s, %s, %s, 1)
    """

    cursor.execute(sql, (nombre, descripcion, unidad, puntos_por_kg, id_tipo_residuo))
    conexion.commit()

    cursor.close()
    conexion.close()


def listar_materiales():
    """
    Muestra todos los materiales registrados.
    """
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = "SELECT * FROM tipo_material"
    cursor.execute(sql)

    materiales = cursor.fetchall()

    cursor.close()
    conexion.close()

    return materiales


def buscar_material(id_material):
    """
    Busca un material por su ID.
    """
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = "SELECT * FROM tipo_material WHERE id_tipo_material = %s"
    cursor.execute(sql, (id_material,))

    material = cursor.fetchone()

    cursor.close()
    conexion.close()

    return material


def editar_material(id_material, nombre, descripcion, unidad, puntos_por_kg, id_tipo_residuo):
    """
    Edita los datos de un material.
    """
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
        UPDATE tipo_material
        SET nombre = %s,
            descripcion = %s,
            unidad = %s,
            puntos_por_kg = %s,
            id_tipo_residuo = %s
        WHERE id_tipo_material = %s
    """

    cursor.execute(sql, (
        nombre,
        descripcion,
        unidad,
        puntos_por_kg,
        id_tipo_residuo,
        id_material
    ))

    conexion.commit()

    cursor.close()
    conexion.close()


def cambiar_estado(id_material, id_estado):
    """
    Cambia el estado de un material.
    1 = Activo
    2 = Inactivo
    """
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
        UPDATE tipo_material
        SET id_estado = %s
        WHERE id_tipo_material = %s
    """

    cursor.execute(sql, (id_estado, id_material))
    conexion.commit()

    cursor.close()
    conexion.close()