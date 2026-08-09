## Archivo: noticias_model.py
## Modelo de datos: contiene consultas SQL y operaciones directas con la base de datos.

from app.common.database import obtener_conexion


def crear_noticia(titulo, descripcion, imagen, id_usuario):
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    cursor.execute(
        """
        INSERT INTO noticias (titulo, descripcion, imagen, id_usuario, id_estado)
        VALUES (%s, %s, %s, %s, 1)
        RETURNING id_noticia
        """,
        (titulo, descripcion, imagen, id_usuario),
    )
    id_noticia = cursor.fetchone()["id_noticia"]
    conexion.commit()
    cursor.close()
    conexion.close()
    return id_noticia


def listar_noticias():
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    cursor.execute("SELECT * FROM noticias ORDER BY fecha_publicacion DESC")
    datos = cursor.fetchall()
    cursor.close()
    conexion.close()
    return datos


def cambiar_estado_noticia(id_noticia, id_estado):
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    cursor.execute(
        "UPDATE noticias SET id_estado = %s WHERE id_noticia = %s",
        (id_estado, id_noticia),
    )
    actualizado = cursor.rowcount > 0
    conexion.commit()
    cursor.close()
    conexion.close()
    return actualizado
