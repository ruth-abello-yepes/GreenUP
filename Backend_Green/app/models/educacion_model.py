"""Consultas del panel educativo, sus desafios y el progreso del ciudadano."""

from app.common.database import obtener_conexion


def obtener_panel_educacion(id_usuario):
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    try:
        cursor.execute(
            """
            SELECT contenido_educativo.id_contenido,
                   contenido_educativo.titulo,
                   contenido_educativo.descripcion,
                   contenido_educativo.tipo,
                   contenido_educativo.url_recurso,
                   contenido_educativo.imagen,
                   contenido_educativo.fecha_publicacion,
                   contenido_educativo.categoria,
                   contenido_educativo.duracion_minutos,
                   contenido_educativo.fuente,
                   contenido_educativo.destacado,
                   contenido_educativo.origen,
                   (progreso_contenido.id_progreso IS NOT NULL) AS completado,
                   progreso_contenido.fecha_completado
            FROM contenido_educativo
            LEFT JOIN progreso_contenido
              ON progreso_contenido.id_contenido = contenido_educativo.id_contenido
             AND progreso_contenido.id_usuario = %s
            WHERE contenido_educativo.id_estado = 1
            ORDER BY contenido_educativo.destacado DESC,
                     contenido_educativo.fecha_publicacion DESC,
                     contenido_educativo.id_contenido DESC
            """,
            (id_usuario,),
        )
        contenidos = cursor.fetchall()

        cursor.execute(
            """
            SELECT tipo_material.id_tipo_material, tipo_material.nombre,
                   tipo_material.descripcion, tipo_material.unidad,
                   tipo_material.origen_material,
                   tipo_material.preparacion, tipo_material.objetos_permitidos,
                   tipo_material.objetos_no_permitidos,
                   tipo_material.impacto_ambiental, tipo_material.imagen,
                   tipo_material.fuente_url,
                   COALESCE(tipo_residuo.nombre, 'Material aprovechable') AS tipo_residuo,
                   tipo_residuo.color_contenedor
            FROM tipo_material
            LEFT JOIN tipo_residuo
              ON tipo_residuo.id_tipo_residuo = tipo_material.id_tipo_residuo
            WHERE tipo_material.id_estado = 1
            ORDER BY tipo_material.nombre
            """
        )
        materiales = cursor.fetchall()

        cursor.execute(
            """
            SELECT desafio_educativo.id_desafio,
                   desafio_educativo.titulo,
                   desafio_educativo.descripcion,
                   desafio_educativo.categoria,
                   desafio_educativo.icono,
                   desafio_educativo.duracion_dias,
                   desafio_educativo.instrucciones,
                   desafio_educativo.fecha_inicio,
                   desafio_educativo.fecha_fin,
                   COALESCE(usuario_desafio.estado, 'disponible') AS estado_usuario,
                   usuario_desafio.fecha_aceptacion,
                   usuario_desafio.fecha_completado
            FROM desafio_educativo
            LEFT JOIN usuario_desafio
              ON usuario_desafio.id_desafio = desafio_educativo.id_desafio
             AND usuario_desafio.id_usuario = %s
            WHERE desafio_educativo.id_estado = 1
              AND (desafio_educativo.fecha_inicio IS NULL OR desafio_educativo.fecha_inicio <= CURRENT_DATE)
              AND (desafio_educativo.fecha_fin IS NULL OR desafio_educativo.fecha_fin >= CURRENT_DATE)
            ORDER BY desafio_educativo.id_desafio
            """,
            (id_usuario,),
        )
        desafios = cursor.fetchall()

        cursor.execute(
            """
            SELECT
              (SELECT COUNT(*)::int FROM progreso_contenido
               WHERE id_usuario = %s) AS contenidos_completados,
              (SELECT COUNT(*)::int FROM usuario_desafio
               WHERE id_usuario = %s AND estado = 'aceptado') AS desafios_activos,
              (SELECT COUNT(*)::int FROM usuario_desafio
               WHERE id_usuario = %s AND estado = 'completado') AS desafios_reportados,
              (SELECT COUNT(*)::int FROM progreso_contenido) AS lecturas_comunidad,
              (SELECT COUNT(*)::int FROM usuario_desafio
               WHERE estado = 'completado') AS desafios_comunidad
              ,(SELECT COUNT(*)::int FROM noticia_juego_intentos
                WHERE id_usuario = %s) AS noticias_completadas
            """,
            (id_usuario, id_usuario, id_usuario, id_usuario),
        )
        resumen = cursor.fetchone()

        cursor.execute(
            "SELECT * FROM sincronizacion_educacion WHERE proveedor = 'youtube-data-api'"
        )
        sincronizacion = cursor.fetchone()

        return {
            "contenidos": contenidos,
            "materiales": materiales,
            "desafios": desafios,
            "resumen": resumen,
            "sincronizacion": sincronizacion,
        }
    finally:
        cursor.close()
        conexion.close()


def completar_contenido(id_usuario, id_contenido):
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO progreso_contenido (
                id_usuario, id_contenido, puntos_otorgados
            )
            SELECT %s, id_contenido, 0
            FROM contenido_educativo
            WHERE id_contenido = %s AND id_estado = 1
            ON CONFLICT (id_usuario, id_contenido) DO NOTHING
            RETURNING fecha_completado
            """,
            (id_usuario, id_contenido),
        )
        progreso = cursor.fetchone()
        if progreso:
            conexion.commit()
            return progreso, True

        cursor.execute(
            "SELECT id_contenido FROM contenido_educativo WHERE id_contenido = %s AND id_estado = 1",
            (id_contenido,),
        )
        existe = cursor.fetchone() is not None
        conexion.rollback()
        return None, existe
    finally:
        cursor.close()
        conexion.close()


def aceptar_desafio(id_usuario, id_desafio):
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO usuario_desafio (id_usuario, id_desafio)
            SELECT %s, id_desafio
            FROM desafio_educativo
            WHERE id_desafio = %s AND id_estado = 1
            ON CONFLICT (id_usuario, id_desafio) DO NOTHING
            RETURNING estado, fecha_aceptacion
            """,
            (id_usuario, id_desafio),
        )
        resultado = cursor.fetchone()
        if resultado:
            conexion.commit()
            return resultado, True

        cursor.execute(
            """
            SELECT usuario_desafio.estado, usuario_desafio.fecha_aceptacion
            FROM usuario_desafio
            WHERE id_usuario = %s AND id_desafio = %s
            """,
            (id_usuario, id_desafio),
        )
        existente = cursor.fetchone()
        conexion.rollback()
        return existente, existente is not None
    finally:
        cursor.close()
        conexion.close()


def completar_desafio(id_usuario, id_desafio):
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    try:
        cursor.execute(
            """
            UPDATE usuario_desafio
            SET estado = 'completado',
                fecha_completado = CURRENT_TIMESTAMP,
                puntos_otorgados = 0
            FROM desafio_educativo
            WHERE usuario_desafio.id_usuario = %s
              AND usuario_desafio.id_desafio = %s
              AND usuario_desafio.estado = 'aceptado'
              AND desafio_educativo.id_desafio = usuario_desafio.id_desafio
              AND desafio_educativo.id_estado = 1
            RETURNING usuario_desafio.fecha_completado
            """,
            (id_usuario, id_desafio),
        )
        resultado = cursor.fetchone()
        if resultado:
            conexion.commit()
            return resultado, "completado"

        cursor.execute(
            """
            SELECT estado, fecha_completado
            FROM usuario_desafio
            WHERE id_usuario = %s AND id_desafio = %s
            """,
            (id_usuario, id_desafio),
        )
        existente = cursor.fetchone()
        conexion.rollback()
        if existente and existente["estado"] == "completado":
            return existente, "ya_completado"
        return None, "no_aceptado"
    finally:
        cursor.close()
        conexion.close()


def guardar_videos_youtube(videos):
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    insertados = 0
    try:
        for video in videos:
            cursor.execute(
                """
                INSERT INTO contenido_educativo (
                    titulo, descripcion, tipo, url_recurso, imagen, id_usuario,
                          id_estado, categoria, duracion_minutos, puntos, fuente,
                    external_id, destacado, origen, fecha_sincronizacion
                ) VALUES (%s, %s, 'video', %s, %s, NULL, 1, %s, 5, 0, %s,
                          %s, FALSE, 'YouTube', CURRENT_TIMESTAMP)
                ON CONFLICT (origen, external_id) WHERE external_id IS NOT NULL
                DO UPDATE SET
                    titulo = EXCLUDED.titulo,
                    descripcion = EXCLUDED.descripcion,
                    url_recurso = EXCLUDED.url_recurso,
                    imagen = EXCLUDED.imagen,
                    categoria = EXCLUDED.categoria,
                    fuente = EXCLUDED.fuente,
                    fecha_sincronizacion = CURRENT_TIMESTAMP,
                    id_estado = 1
                """,
                (
                    video["titulo"], video.get("descripcion"), video["url_recurso"],
                    video.get("imagen"), video.get("categoria", "Reciclaje"),
                    video.get("fuente"), video["external_id"],
                ),
            )
            insertados += cursor.rowcount
        conexion.commit()
        return insertados
    finally:
        cursor.close()
        conexion.close()


def obtener_estado_sincronizacion():
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    try:
        cursor.execute(
            "SELECT * FROM sincronizacion_educacion WHERE proveedor = 'youtube-data-api'"
        )
        return cursor.fetchone()
    finally:
        cursor.close()
        conexion.close()


def guardar_estado_sincronizacion(estado, mensaje=None):
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO sincronizacion_educacion (
                proveedor, fecha_ultimo_intento, estado, mensaje
            ) VALUES ('youtube-data-api', CURRENT_TIMESTAMP, %s, %s)
            ON CONFLICT (proveedor) DO UPDATE SET
                fecha_ultimo_intento = CURRENT_TIMESTAMP,
                estado = EXCLUDED.estado,
                mensaje = EXCLUDED.mensaje
            """,
            (estado, mensaje),
        )
        conexion.commit()
    finally:
        cursor.close()
        conexion.close()
