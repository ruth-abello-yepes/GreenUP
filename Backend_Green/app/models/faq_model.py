## Archivo: faq_model.py
## Modelo de datos: contiene consultas SQL y operaciones directas con la base de datos.

# Modelo de preguntas frecuentes

from app.common.database import obtener_conexion


def crear_pregunta(pregunta, respuesta, categoria, orden):
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
        INSERT INTO preguntas_frecuentes
        (pregunta, respuesta, categoria, orden, id_estado)
        VALUES (%s, %s, %s, %s, 1)
    """

    cursor.execute(sql, (pregunta, respuesta, categoria, orden))
    conexion.commit()

    cursor.close()
    conexion.close()


def listar_preguntas():
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    cursor.execute("SELECT * FROM preguntas_frecuentes")
    datos = cursor.fetchall()

    cursor.close()
    conexion.close()

    return datos