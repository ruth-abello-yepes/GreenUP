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
    conexion = obtener_conexion()
    cursor = conexion.cursor()
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
