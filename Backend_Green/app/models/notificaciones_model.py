## Archivo: notificaciones_model.py
## Modelo de datos: contiene consultas SQL y operaciones directas con la base de datos.

from app.common.database import obtener_conexion


def listar_notificaciones(id_usuario, id_rol):
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    cursor.execute(
        """
        SELECT *
        FROM notificaciones
        WHERE id_estado = 1
          AND (id_usuario = %s OR id_rol = %s)
        ORDER BY fecha_hora DESC
        LIMIT 30
        """,
        (id_usuario, id_rol),
    )
    datos = cursor.fetchall()
    cursor.close()
    conexion.close()
    return datos


def crear_notificacion(titulo, mensaje, id_usuario=None, id_rol=None):
    """
    Crea una notificacion real en Supabase.

    Antes de insertar revisa si ya existe la misma notificacion reciente para
    evitar duplicados cuando una accion se envia dos veces por error.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()
    cursor.execute(
        """
        SELECT id_notificacion
        FROM notificaciones
        WHERE titulo = %s
          AND mensaje = %s
          AND COALESCE(id_usuario, 0) = COALESCE(%s, 0)
          AND COALESCE(id_rol, 0) = COALESCE(%s, 0)
          AND fecha_hora >= NOW() - INTERVAL '2 minutes'
        ORDER BY fecha_hora DESC
        LIMIT 1
        """,
        (titulo, mensaje, id_usuario, id_rol),
    )
    existente = cursor.fetchone()
    if existente:
        cursor.close()
        conexion.close()
        return existente["id_notificacion"]

    cursor.execute(
        """
        INSERT INTO notificaciones (titulo, mensaje, id_usuario, id_rol)
        VALUES (%s, %s, %s, %s)
        RETURNING id_notificacion
        """,
        (titulo, mensaje, id_usuario, id_rol),
    )
    id_notificacion = cursor.fetchone()["id_notificacion"]
    conexion.commit()
    cursor.close()
    conexion.close()
    return id_notificacion


def marcar_notificacion_leida(id_notificacion, id_usuario, id_rol):
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    cursor.execute(
        """
        UPDATE notificaciones
        SET leida = true
        WHERE id_notificacion = %s
          AND (id_usuario = %s OR id_rol = %s)
        """,
        (id_notificacion, id_usuario, id_rol),
    )
    actualizado = cursor.rowcount > 0
    conexion.commit()
    cursor.close()
    conexion.close()
    return actualizado
