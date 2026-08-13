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


def listar_noticias_ambientales(busqueda=None, pagina=1, por_pagina=9):
    """Lista noticias y lee el estado del caché usando una sola conexión."""
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    condiciones = ["id_estado = 1"]
    parametros = []

    if busqueda:
        condiciones.append("(titulo ILIKE %s OR descripcion ILIKE %s OR fuente ILIKE %s)")
        termino = f"%{busqueda}%"
        parametros.extend([termino, termino, termino])

    where = " AND ".join(condiciones)
    cursor.execute(f"SELECT COUNT(*)::int AS total FROM noticias WHERE {where}", tuple(parametros))
    total = (cursor.fetchone() or {}).get("total", 0)

    offset = (pagina - 1) * por_pagina
    cursor.execute(
        f"""
        SELECT id_noticia, titulo, descripcion, imagen, fecha_publicacion,
               url_original, fuente, categoria, origen
        FROM noticias
        WHERE {where}
        ORDER BY fecha_publicacion DESC, id_noticia DESC
        LIMIT %s OFFSET %s
        """,
        tuple(parametros + [por_pagina, offset]),
    )
    noticias = cursor.fetchall()
    cursor.execute(
        "SELECT * FROM sincronizacion_noticias WHERE proveedor = %s",
        ("world-news-api",),
    )
    estado_sincronizacion = cursor.fetchone()
    cursor.close()
    conexion.close()
    return noticias, total, estado_sincronizacion


def existen_noticias_activas():
    """Comprueba rápidamente si hay contenido que se pueda mostrar desde el caché."""
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    cursor.execute("SELECT EXISTS(SELECT 1 FROM noticias WHERE id_estado = 1) AS existe")
    existe = bool((cursor.fetchone() or {}).get("existe"))
    cursor.close()
    conexion.close()
    return existe


def guardar_noticias_externas(noticias):
    """Inserta artículos nuevos y evita duplicarlos por su URL original."""
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    insertadas = 0
    try:
        for noticia in noticias:
            cursor.execute(
                """
                INSERT INTO noticias (
                    titulo, descripcion, imagen, fecha_publicacion, id_usuario,
                    id_estado, url_original, fuente, categoria, origen,
                    fecha_sincronizacion
                )
                VALUES (%s, %s, %s, %s, NULL, 1, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (url_original) WHERE url_original IS NOT NULL DO NOTHING
                """,
                (
                    noticia["titulo"],
                    noticia.get("descripcion"),
                    noticia.get("imagen"),
                    noticia["fecha_publicacion"],
                    noticia["url_original"],
                    noticia.get("fuente"),
                    noticia.get("categoria", "Medio ambiente"),
                    noticia.get("origen", "World News API"),
                ),
            )
            insertadas += cursor.rowcount
        conexion.commit()
        return insertadas
    finally:
        cursor.close()
        conexion.close()


def obtener_estado_sincronizacion(proveedor):
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    cursor.execute(
        "SELECT * FROM sincronizacion_noticias WHERE proveedor = %s",
        (proveedor,),
    )
    estado = cursor.fetchone()
    cursor.close()
    conexion.close()
    return estado


def guardar_estado_sincronizacion(proveedor, estado, mensaje=None):
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    cursor.execute(
        """
        INSERT INTO sincronizacion_noticias (
            proveedor, fecha_ultimo_intento, estado, mensaje
        )
        VALUES (%s, CURRENT_TIMESTAMP, %s, %s)
        ON CONFLICT (proveedor) DO UPDATE SET
            fecha_ultimo_intento = CURRENT_TIMESTAMP,
            estado = EXCLUDED.estado,
            mensaje = EXCLUDED.mensaje
        """,
        (proveedor, estado, mensaje),
    )
    conexion.commit()
    cursor.close()
    conexion.close()


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
