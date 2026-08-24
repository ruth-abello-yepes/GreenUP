## Archivo: comunidad_model.py
## Modelo de datos para foro, juego de noticias y puntajes de ciudadanos.

from app.common.database import obtener_conexion


def asegurar_tablas_comunidad():
    """
    Crea las tablas auxiliares de comunidad si todavía no existen.

    Esta estrategia evita romper el proyecto cuando la base ya tiene
    tablas históricas, pero aún no posee la parte nueva del foro o del juego.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()
    try:
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS foro_temas (
                id_tema SERIAL PRIMARY KEY,
                titulo VARCHAR(220) NOT NULL,
                contenido TEXT NOT NULL,
                imagen TEXT,
                tipo_publicacion VARCHAR(30) NOT NULL DEFAULT 'opinion',
                id_usuario INTEGER NOT NULL,
                id_rol INTEGER NOT NULL,
                id_estado INTEGER NOT NULL DEFAULT 1,
                moderado BOOLEAN NOT NULL DEFAULT FALSE,
                eliminado_por_moderacion BOOLEAN NOT NULL DEFAULT FALSE,
                fecha_publicacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS ciudadano_puntos_juego (
                id_usuario INTEGER PRIMARY KEY,
                puntos_total INTEGER NOT NULL DEFAULT 0,
                noticias_completadas INTEGER NOT NULL DEFAULT 0,
                ultima_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS noticia_cuestionarios (
                id_pregunta SERIAL PRIMARY KEY,
                id_noticia INTEGER NOT NULL,
                pregunta TEXT NOT NULL,
                opcion_a TEXT NOT NULL,
                opcion_b TEXT NOT NULL,
                opcion_c TEXT NOT NULL,
                opcion_d TEXT NOT NULL,
                respuesta_correcta VARCHAR(1) NOT NULL,
                explicacion TEXT,
                id_estado INTEGER NOT NULL DEFAULT 1
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS noticia_juego_intentos (
                id_intento SERIAL PRIMARY KEY,
                id_noticia INTEGER NOT NULL,
                id_usuario INTEGER NOT NULL,
                puntaje_obtenido INTEGER NOT NULL DEFAULT 0,
                respuestas_correctas INTEGER NOT NULL DEFAULT 0,
                total_preguntas INTEGER NOT NULL DEFAULT 0,
                fecha_resolucion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (id_noticia, id_usuario)
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS foro_respuestas (
                id_respuesta SERIAL PRIMARY KEY,
                id_tema INTEGER NOT NULL,
                id_usuario INTEGER NOT NULL,
                id_rol INTEGER NOT NULL,
                respuesta TEXT NOT NULL,
                imagen TEXT,
                id_estado INTEGER NOT NULL DEFAULT 1,
                moderado BOOLEAN NOT NULL DEFAULT FALSE,
                eliminada_por_moderacion BOOLEAN NOT NULL DEFAULT FALSE,
                fecha_respuesta TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conexion.commit()
    finally:
        cursor.close()
        conexion.close()


def listar_temas_foro(id_rol=None):
    """Obtiene los temas visibles del foro."""

    asegurar_tablas_comunidad()
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    try:
        filtros = [
            "foro_temas.id_estado = 1",
            "foro_temas.eliminado_por_moderacion = FALSE",
        ]
        parametros = []
        cursor.execute(
            f"""
            SELECT
                foro_temas.id_tema,
                foro_temas.titulo,
                foro_temas.contenido,
                foro_temas.imagen,
                foro_temas.tipo_publicacion,
                foro_temas.id_usuario,
                foro_temas.id_rol,
                foro_temas.id_estado,
                foro_temas.moderado,
                foro_temas.fecha_publicacion,
                COALESCE(usuarios.nombres || ' ' || usuarios.apellidos, usuarios.usuario, 'Comunidad GreenUp') AS autor,
                (
                    SELECT COUNT(*)
                    FROM foro_respuestas
                    WHERE foro_respuestas.id_tema = foro_temas.id_tema
                      AND foro_respuestas.id_estado = 1
                      AND foro_respuestas.eliminada_por_moderacion = FALSE
                )::int AS total_respuestas
            FROM foro_temas
            LEFT JOIN usuarios ON usuarios.id_usuario = foro_temas.id_usuario
            WHERE {' AND '.join(filtros)}
            ORDER BY foro_temas.fecha_publicacion DESC, foro_temas.id_tema DESC
            """,
            tuple(parametros),
        )
        return cursor.fetchall()
    finally:
        cursor.close()
        conexion.close()


def crear_tema_foro(titulo, contenido, imagen, tipo_publicacion, id_usuario, id_rol, moderado=False):
    """Guarda un tema nuevo del foro."""

    asegurar_tablas_comunidad()
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO foro_temas (
                titulo, contenido, imagen, tipo_publicacion, id_usuario, id_rol, moderado
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id_tema
            """,
            (titulo, contenido, imagen, tipo_publicacion, id_usuario, id_rol, moderado),
        )
        id_tema = cursor.fetchone()["id_tema"]
        conexion.commit()
        return id_tema
    finally:
        cursor.close()
        conexion.close()


def marcar_tema_moderado(id_tema):
    """Inactiva un tema por lenguaje inadecuado."""

    asegurar_tablas_comunidad()
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    try:
        cursor.execute(
            """
            UPDATE foro_temas
            SET id_estado = 2,
                moderado = TRUE,
                eliminado_por_moderacion = TRUE
            WHERE id_tema = %s
            """,
            (id_tema,),
        )
        conexion.commit()
    finally:
        cursor.close()
        conexion.close()


def listar_respuestas_tema(id_tema):
    """Lista las respuestas visibles de un tema del foro."""

    asegurar_tablas_comunidad()
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    try:
        cursor.execute(
            """
            SELECT
                foro_respuestas.id_respuesta,
                foro_respuestas.id_tema,
                foro_respuestas.id_usuario,
                foro_respuestas.id_rol,
                foro_respuestas.respuesta,
                foro_respuestas.imagen,
                foro_respuestas.fecha_respuesta,
                COALESCE(usuarios.nombres || ' ' || usuarios.apellidos, usuarios.usuario, 'Comunidad GreenUp') AS autor
            FROM foro_respuestas
            LEFT JOIN usuarios ON usuarios.id_usuario = foro_respuestas.id_usuario
            WHERE foro_respuestas.id_tema = %s
              AND foro_respuestas.id_estado = 1
              AND foro_respuestas.eliminada_por_moderacion = FALSE
            ORDER BY foro_respuestas.fecha_respuesta ASC, foro_respuestas.id_respuesta ASC
            """,
            (id_tema,),
        )
        return cursor.fetchall()
    finally:
        cursor.close()
        conexion.close()


def crear_respuesta_foro(id_tema, id_usuario, id_rol, respuesta, imagen=None, moderado=False):
    """Guarda una respuesta nueva dentro del foro."""

    asegurar_tablas_comunidad()
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO foro_respuestas (
                id_tema, id_usuario, id_rol, respuesta, imagen, moderado
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id_respuesta
            """,
            (id_tema, id_usuario, id_rol, respuesta, imagen, moderado),
        )
        id_respuesta = cursor.fetchone()["id_respuesta"]
        conexion.commit()
        return id_respuesta
    finally:
        cursor.close()
        conexion.close()


def marcar_respuesta_moderada(id_respuesta):
    """Inactiva una respuesta por moderación automática."""

    asegurar_tablas_comunidad()
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    try:
        cursor.execute(
            """
            UPDATE foro_respuestas
            SET id_estado = 2,
                moderado = TRUE,
                eliminada_por_moderacion = TRUE
            WHERE id_respuesta = %s
            """,
            (id_respuesta,),
        )
        conexion.commit()
    finally:
        cursor.close()
        conexion.close()


def sumar_puntos_respuesta_foro(id_usuario, puntos=0):
    """Registra actividad del foro sin sumar puntos ni recompensas."""

    asegurar_tablas_comunidad()
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO ciudadano_puntos_juego (
                id_usuario, puntos_total, noticias_completadas, ultima_actualizacion
            )
            VALUES (%s, %s, 0, CURRENT_TIMESTAMP)
            ON CONFLICT (id_usuario) DO UPDATE SET
                puntos_total = ciudadano_puntos_juego.puntos_total,
                ultima_actualizacion = CURRENT_TIMESTAMP
            """,
            (id_usuario, 0, 0),
        )
        conexion.commit()
    finally:
        cursor.close()
        conexion.close()


def listar_puntajes_juego():
    """Retorna el puntaje acumulado del juego por ciudadano."""

    asegurar_tablas_comunidad()
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    try:
        cursor.execute(
            """
            SELECT
                usuarios.id_usuario,
                COALESCE(usuarios.nombres || ' ' || usuarios.apellidos, usuarios.usuario, 'Ciudadano') AS ciudadano,
                usuarios.usuario,
                COALESCE(ciudadano_puntos_juego.puntos_total, 0) AS puntos_total,
                COALESCE(ciudadano_puntos_juego.noticias_completadas, 0) AS noticias_completadas,
                ciudadano_puntos_juego.ultima_actualizacion
            FROM usuarios
            LEFT JOIN ciudadano_puntos_juego
              ON ciudadano_puntos_juego.id_usuario = usuarios.id_usuario
            WHERE usuarios.id_rol = 3
            ORDER BY COALESCE(ciudadano_puntos_juego.puntos_total, 0) DESC, usuarios.id_usuario
            """
        )
        return cursor.fetchall()
    finally:
        cursor.close()
        conexion.close()


def obtener_puntaje_ciudadano(id_usuario):
    """Consulta el puntaje del ciudadano autenticado."""

    asegurar_tablas_comunidad()
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    try:
        cursor.execute(
            """
            SELECT
                id_usuario,
                puntos_total,
                noticias_completadas,
                ultima_actualizacion
            FROM ciudadano_puntos_juego
            WHERE id_usuario = %s
            """,
            (id_usuario,),
        )
        return cursor.fetchone()
    finally:
        cursor.close()
        conexion.close()


def listar_preguntas_noticia(id_noticia):
    """Obtiene las preguntas guardadas para una noticia."""

    asegurar_tablas_comunidad()
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    try:
        cursor.execute(
            """
            SELECT
                id_pregunta,
                id_noticia,
                pregunta,
                opcion_a,
                opcion_b,
                opcion_c,
                opcion_d,
                respuesta_correcta,
                explicacion
            FROM noticia_cuestionarios
            WHERE id_noticia = %s AND id_estado = 1
            ORDER BY id_pregunta
            """,
            (id_noticia,),
        )
        return cursor.fetchall()
    finally:
        cursor.close()
        conexion.close()


def buscar_preguntas_duplicadas_otras_noticias(id_noticia, preguntas):
    """Busca si una pregunta activa ya pertenece a otra noticia."""

    textos = [
        " ".join(str(pregunta or "").split()).strip().lower()
        for pregunta in preguntas
        if str(pregunta or "").strip()
    ]
    if not textos:
        return []

    asegurar_tablas_comunidad()
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    try:
        cursor.execute(
            """
            SELECT id_noticia, pregunta
            FROM noticia_cuestionarios
            WHERE id_estado = 1
              AND id_noticia <> %s
              AND LOWER(TRIM(REGEXP_REPLACE(pregunta, '\\s+', ' ', 'g'))) = ANY(%s)
            ORDER BY id_noticia, id_pregunta
            """,
            (id_noticia, textos),
        )
        return cursor.fetchall()
    finally:
        cursor.close()
        conexion.close()


def eliminar_preguntas_noticia(id_noticia):
    """Borra las preguntas actuales de una noticia para regenerarlas o reemplazarlas."""

    asegurar_tablas_comunidad()
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    try:
        cursor.execute(
            """
            DELETE FROM noticia_cuestionarios
            WHERE id_noticia = %s
            """,
            (id_noticia,),
        )
        conexion.commit()
    finally:
        cursor.close()
        conexion.close()


def crear_pregunta_noticia(id_noticia, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, explicacion):
    """Inserta una pregunta de quiz para una noticia."""

    asegurar_tablas_comunidad()
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO noticia_cuestionarios (
                id_noticia, pregunta, opcion_a, opcion_b, opcion_c, opcion_d,
                respuesta_correcta, explicacion
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id_pregunta
            """,
            (id_noticia, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, explicacion),
        )
        id_pregunta = cursor.fetchone()["id_pregunta"]
        conexion.commit()
        return id_pregunta
    finally:
        cursor.close()
        conexion.close()


def reemplazar_preguntas_noticia(id_noticia, preguntas):
    """Sustituye por completo el cuestionario de una noticia."""

    asegurar_tablas_comunidad()
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    try:
        cursor.execute(
            """
            DELETE FROM noticia_cuestionarios
            WHERE id_noticia = %s
            """,
            (id_noticia,),
        )

        for pregunta in preguntas:
            cursor.execute(
                """
                INSERT INTO noticia_cuestionarios (
                    id_noticia, pregunta, opcion_a, opcion_b, opcion_c, opcion_d,
                    respuesta_correcta, explicacion
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    id_noticia,
                    pregunta["pregunta"],
                    pregunta["opcion_a"],
                    pregunta["opcion_b"],
                    pregunta["opcion_c"],
                    pregunta["opcion_d"],
                    pregunta["respuesta_correcta"],
                    pregunta.get("explicacion"),
                ),
            )

        conexion.commit()
    finally:
        cursor.close()
        conexion.close()


def registrar_resultado_juego(id_noticia, id_usuario, puntaje_obtenido, respuestas_correctas, total_preguntas):
    """Guarda o actualiza el resultado del ciudadano en una noticia."""

    asegurar_tablas_comunidad()
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    try:
        cursor.execute(
            """
            SELECT puntaje_obtenido
            FROM noticia_juego_intentos
            WHERE id_noticia = %s AND id_usuario = %s
            """,
            (id_noticia, id_usuario),
        )
        existente = cursor.fetchone()

        if existente:
            puntaje_anterior = int(existente.get("puntaje_obtenido") or 0)
            puntaje_delta = max(0, puntaje_obtenido - puntaje_anterior)
            cursor.execute(
                """
                UPDATE noticia_juego_intentos
                SET puntaje_obtenido = %s,
                    respuestas_correctas = %s,
                    total_preguntas = %s,
                    fecha_resolucion = CURRENT_TIMESTAMP
                WHERE id_noticia = %s AND id_usuario = %s
                """,
                (puntaje_obtenido, respuestas_correctas, total_preguntas, id_noticia, id_usuario),
            )
        else:
            puntaje_delta = puntaje_obtenido
            cursor.execute(
                """
                INSERT INTO noticia_juego_intentos (
                    id_noticia, id_usuario, puntaje_obtenido,
                    respuestas_correctas, total_preguntas
                )
                VALUES (%s, %s, %s, %s, %s)
                """,
                (id_noticia, id_usuario, puntaje_obtenido, respuestas_correctas, total_preguntas),
            )

        cursor.execute(
            """
            INSERT INTO ciudadano_puntos_juego (
                id_usuario, puntos_total, noticias_completadas, ultima_actualizacion
            )
            VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (id_usuario) DO UPDATE SET
                puntos_total = ciudadano_puntos_juego.puntos_total + %s,
                noticias_completadas = CASE
                    WHEN %s > 0 THEN ciudadano_puntos_juego.noticias_completadas + 1
                    ELSE ciudadano_puntos_juego.noticias_completadas
                END,
                ultima_actualizacion = CURRENT_TIMESTAMP
            """,
            (id_usuario, puntaje_delta, 1 if not existente else 0, puntaje_delta, 1 if not existente else 0),
        )
        conexion.commit()
        return puntaje_delta
    finally:
        cursor.close()
        conexion.close()
