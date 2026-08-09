## Archivo: novedades_model.py
## Modelo de datos: contiene consultas SQL y operaciones directas con la base de datos.

# Modelo de novedades

from app.common.database import obtener_conexion


def _tabla_tiene_columna(cursor, tabla, columna):
    cursor.execute(
        """
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = %s
          AND column_name = %s
        """,
        (tabla, columna),
    )
    return cursor.fetchone() is not None


def crear_novedad(titulo, descripcion, imagen, id_usuario, id_punto=None, motivo=None, comentario=None, ubicacion=None):
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    columnas = ["titulo", "descripcion", "imagen", "id_usuario", "id_estado"]
    valores = [titulo, descripcion, imagen, id_usuario, 1]

    extras = {
        "id_punto": id_punto,
        "motivo": motivo,
        "comentario": comentario,
        "ubicacion": ubicacion,
    }

    for columna, valor in extras.items():
        if _tabla_tiene_columna(cursor, "novedades", columna):
            columnas.append(columna)
            valores.append(valor)

    placeholders = ", ".join(["%s"] * len(columnas))
    cursor.execute(
        f"INSERT INTO novedades ({', '.join(columnas)}) VALUES ({placeholders})",
        tuple(valores),
    )
    conexion.commit()

    cursor.close()
    conexion.close()


def listar_novedades():
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    cursor.execute("SELECT * FROM novedades")
    datos = cursor.fetchall()

    cursor.close()
    conexion.close()

    return datos


def buscar_novedad(id_novedad):
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = "SELECT * FROM novedades WHERE id_novedad = %s"
    cursor.execute(sql, (id_novedad,))

    dato = cursor.fetchone()

    cursor.close()
    conexion.close()

    return dato


def cambiar_estado_novedad(id_novedad, id_estado):
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
        UPDATE novedades
        SET id_estado = %s
        WHERE id_novedad = %s
    """

    cursor.execute(sql, (id_estado, id_novedad))
    conexion.commit()

    cursor.close()
    conexion.close()
