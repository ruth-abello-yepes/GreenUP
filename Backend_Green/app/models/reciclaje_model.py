## Archivo: reciclaje_model.py
## Modelo de datos: contiene consultas SQL y operaciones directas con la base de datos.

from app.common.database import obtener_conexion


def _tabla_tiene_columna(cursor, tabla, columna):
    """
    Revisa si una tabla tiene una columna especifica.

    Esto nos ayuda a trabajar con una base que ha venido cambiando durante el
    proyecto sin romper consultas antiguas.
    """

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


def crear_reciclaje(cantidad, observaciones, id_usuario, id_tipo_material, id_punto):
    """
    Crea un registro de reciclaje en estado pendiente.

    Regla nueva del flujo:
    - 1 = pendiente
    - 2 = confirmado
    - 3 = rechazado
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
    INSERT INTO registrar_reciclaje
    (cantidad, observaciones, observacion, id_usuario, id_tipo_material, id_punto, id_estado, estado)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    RETURNING id_registro
    """

    datos = (cantidad, observaciones, observaciones, id_usuario, id_tipo_material, id_punto, 1, "pendiente")

    cursor.execute(sql, datos)
    registro = cursor.fetchone()
    conexion.commit()

    cursor.close()
    conexion.close()
    return registro["id_registro"]


def listar_reciclajes():
    """
    Lista todos los reciclajes con datos entendibles para el administrador.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
        SELECT
            registrar_reciclaje.id_registro,
            registrar_reciclaje.cantidad,
            registrar_reciclaje.puntos_obtenidos,
            COALESCE(registrar_reciclaje.observacion, registrar_reciclaje.observaciones, '') AS observaciones,
            registrar_reciclaje.fecha_hora,
            registrar_reciclaje.id_estado,
            COALESCE(NULLIF(registrar_reciclaje.estado, ''), estado.descripcion, 'Sin estado') AS estado,
            registrar_reciclaje.id_usuario,
            COALESCE(
                CONCAT_WS(' ', NULLIF(TRIM(usuarios.nombres), ''), NULLIF(TRIM(usuarios.apellidos), '')),
                usuarios.usuario,
                'Usuario'
            ) AS usuario,
            registrar_reciclaje.id_tipo_material,
            COALESCE(tipo_material.nombre, 'Material') AS material,
            registrar_reciclaje.id_punto,
            COALESCE(puntos_reciclaje.nombre, 'Punto ecologico') AS punto
        FROM registrar_reciclaje
        LEFT JOIN usuarios
            ON usuarios.id_usuario = registrar_reciclaje.id_usuario
        LEFT JOIN tipo_material
            ON tipo_material.id_tipo_material = registrar_reciclaje.id_tipo_material
        LEFT JOIN puntos_reciclaje
            ON puntos_reciclaje.id_punto = registrar_reciclaje.id_punto
        LEFT JOIN estado
            ON estado.id_estado = registrar_reciclaje.id_estado
        ORDER BY registrar_reciclaje.fecha_hora DESC
    """

    cursor.execute(sql)
    datos = cursor.fetchall()

    cursor.close()
    conexion.close()

    return datos


def buscar_reciclaje(id_registro):
    """
    Busca un solo registro con su detalle de usuario, material y punto.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
        SELECT
            registrar_reciclaje.*,
            COALESCE(NULLIF(registrar_reciclaje.estado, ''), estado.descripcion, 'Sin estado') AS estado_legible,
            COALESCE(
                CONCAT_WS(' ', NULLIF(TRIM(usuarios.nombres), ''), NULLIF(TRIM(usuarios.apellidos), '')),
                usuarios.usuario,
                'Usuario'
            ) AS usuario,
            COALESCE(tipo_material.nombre, 'Material') AS material,
            COALESCE(puntos_reciclaje.nombre, 'Punto ecologico') AS punto
        FROM registrar_reciclaje
        LEFT JOIN usuarios
            ON usuarios.id_usuario = registrar_reciclaje.id_usuario
        LEFT JOIN tipo_material
            ON tipo_material.id_tipo_material = registrar_reciclaje.id_tipo_material
        LEFT JOIN puntos_reciclaje
            ON puntos_reciclaje.id_punto = registrar_reciclaje.id_punto
        LEFT JOIN estado
            ON estado.id_estado = registrar_reciclaje.id_estado
        WHERE registrar_reciclaje.id_registro = %s
        LIMIT 1
    """

    cursor.execute(sql, (id_registro,))
    dato = cursor.fetchone()

    cursor.close()
    conexion.close()

    return dato


def listar_reciclajes_por_usuario(id_usuario):
    """
    Lista los registros del ciudadano autenticado.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()
    cursor.execute(
        """
        SELECT
            registrar_reciclaje.id_registro,
            registrar_reciclaje.cantidad::float AS cantidad,
            registrar_reciclaje.puntos_obtenidos,
            COALESCE(registrar_reciclaje.observacion, registrar_reciclaje.observaciones, '') AS observaciones,
            registrar_reciclaje.fecha_hora,
            registrar_reciclaje.id_estado,
            COALESCE(NULLIF(registrar_reciclaje.estado, ''), estado.descripcion, 'Sin estado') AS estado,
            registrar_reciclaje.motivo_rechazo,
            registrar_reciclaje.fecha_confirmacion,
            registrar_reciclaje.id_tipo_material,
            COALESCE(tipo_material.nombre, 'Material') AS material,
            registrar_reciclaje.id_punto,
            COALESCE(puntos_reciclaje.nombre, 'Punto ecologico') AS punto,
            COALESCE(puntos_reciclaje.direccion, '') AS direccion_punto
        FROM registrar_reciclaje
        LEFT JOIN tipo_material
            ON tipo_material.id_tipo_material = registrar_reciclaje.id_tipo_material
        LEFT JOIN puntos_reciclaje
            ON puntos_reciclaje.id_punto = registrar_reciclaje.id_punto
        LEFT JOIN estado
            ON estado.id_estado = registrar_reciclaje.id_estado
        WHERE registrar_reciclaje.id_usuario = %s
        ORDER BY registrar_reciclaje.fecha_hora DESC
        """,
        (id_usuario,),
    )
    datos = cursor.fetchall()
    cursor.close()
    conexion.close()
    return datos


def listar_catalogo_reciclaje():
    """
    Devuelve materiales activos y puntos activos para el formulario del ciudadano.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    cursor.execute(
        """
        SELECT id_tipo_material, nombre, unidad, puntos_por_kg, descripcion
        FROM tipo_material
        WHERE id_estado = 1
        ORDER BY nombre
        """
    )
    materiales = cursor.fetchall()

    cursor.execute(
        """
        SELECT
            puntos_reciclaje.id_punto,
            puntos_reciclaje.nombre,
            puntos_reciclaje.direccion,
            puntos_reciclaje.horario,
            puntos_reciclaje.telefono,
            puntos_reciclaje.latitud,
            puntos_reciclaje.longitud,
            COALESCE(
                string_agg(DISTINCT tipo_material.nombre, ', ')
                    FILTER (WHERE tipo_material.nombre IS NOT NULL),
                ''
            ) AS materiales_aceptados
        FROM puntos_reciclaje
        LEFT JOIN punto_material
            ON punto_material.id_punto = puntos_reciclaje.id_punto
        LEFT JOIN tipo_material
            ON tipo_material.id_tipo_material = punto_material.id_tipo_material
        WHERE puntos_reciclaje.id_estado = 1
        GROUP BY
            puntos_reciclaje.id_punto,
            puntos_reciclaje.nombre,
            puntos_reciclaje.direccion,
            puntos_reciclaje.horario,
            puntos_reciclaje.telefono,
            puntos_reciclaje.latitud,
            puntos_reciclaje.longitud
        ORDER BY puntos_reciclaje.nombre
        """
    )
    puntos = cursor.fetchall()

    cursor.close()
    conexion.close()
    return {"materiales": materiales, "puntos": puntos}


def buscar_usuario_recicladora_por_punto(id_punto):
    """
    Busca el usuario dueno del punto que debe confirmar el reciclaje.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()
    tiene_id_punto = _tabla_tiene_columna(cursor, "recicladoras", "id_punto")

    if tiene_id_punto:
        cursor.execute(
            """
            SELECT recicladoras.id_usuario
            FROM recicladoras
            WHERE recicladoras.id_punto = %s
            LIMIT 1
            """,
            (id_punto,),
        )
    else:
        cursor.execute(
            """
            SELECT recicladoras.id_usuario
            FROM recicladoras
            INNER JOIN puntos_reciclaje
                ON LOWER(TRIM(puntos_reciclaje.nombre)) = LOWER(TRIM(recicladoras.nombre_empresa))
                OR LOWER(TRIM(puntos_reciclaje.direccion)) = LOWER(TRIM(recicladoras.direccion_empresa))
            WHERE puntos_reciclaje.id_punto = %s
            LIMIT 1
            """,
            (id_punto,),
        )

    dato = cursor.fetchone()
    cursor.close()
    conexion.close()
    return dato["id_usuario"] if dato else None


def cambiar_estado_reciclaje(id_registro, id_estado, puntos_obtenidos=None, motivo_rechazo=None, id_recicladora_confirma=None):
    """
    Cambia el estado de un registro.

    Se usa sobre todo cuando la recicladora confirma o rechaza una entrega.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
    UPDATE registrar_reciclaje
    SET id_estado = %s,
        puntos_obtenidos = COALESCE(%s, puntos_obtenidos),
        puntos_otorgados = COALESCE(%s, puntos_otorgados),
        motivo_rechazo = COALESCE(%s, motivo_rechazo),
        id_recicladora_confirma = COALESCE(%s, id_recicladora_confirma)
    WHERE id_registro = %s
    """

    cursor.execute(
        sql,
        (
            id_estado,
            puntos_obtenidos,
            puntos_obtenidos,
            motivo_rechazo,
            id_recicladora_confirma,
            id_registro,
        ),
    )
    conexion.commit()
    actualizado = cursor.rowcount > 0

    cursor.close()
    conexion.close()
    return actualizado
