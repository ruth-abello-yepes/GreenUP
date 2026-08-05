# Modelo de puntos de reciclaje.
# Este archivo habla directamente con Supabase/PostgreSQL.

from app.common.database import obtener_conexion


def crear_ubicacion(
    nombre,
    direccion,
    horario=None,
    latitud=None,
    longitud=None,
    telefono=None,
    responsable=None,
    id_estado=1
):
    """
    Crea un punto ecologico para mostrarlo en el mapa del administrador.

    Las coordenadas son opcionales. Si no llegan latitud y longitud, el HTML
    del mapa intenta ubicar el punto usando la direccion.
    """
    
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
        INSERT INTO puntos_reciclaje
        (nombre, direccion, horario, latitud, longitud, telefono, responsable, id_estado)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id_punto
    """

    cursor.execute(sql, (
        nombre,
        direccion,
        horario,
        latitud,
        longitud,
        telefono,
        responsable,
        id_estado
    ))

    id_punto = cursor.fetchone()["id_punto"]
    conexion.commit()

    cursor.close()
    conexion.close()

    return id_punto


def listar_ubicaciones():
    """
    Lista todos los puntos ecologicos para el mapa del administrador.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    cursor.execute("""
        SELECT *
        FROM puntos_reciclaje
        ORDER BY id_punto DESC
    """)

    data = cursor.fetchall()

    cursor.close()
    conexion.close()

    return data


def cambiar_estado_ubicacion(id_punto, id_estado):
    """
    Cambia el estado de un punto ecologico existente.

    El administrador usa esta accion para activar o inactivar puntos que ya
    estan registrados en Supabase.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    cursor.execute(
        """
        UPDATE puntos_reciclaje
        SET id_estado = %s
        WHERE id_punto = %s
        """,
        (id_estado, id_punto)
    )
    conexion.commit()

    cursor.close()
    conexion.close()
