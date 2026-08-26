## Archivo: recicladoras_model.py
## Modelo de datos: contiene consultas SQL y operaciones directas con la base de datos.


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
def registrar_recicladora(id_usuario, nit_empresa, nombre_empresa, direccion_empresa, telefono_empresa, camara_comercio, id_estado, datos_extra=None):
    """
    Guarda los datos empresariales de una recicladora.

    Los campos extra quedan con COALESCE para que registros antiguos sigan
    funcionando aunque no envien horarios o estados de validacion.
    """

    datos_extra = datos_extra or {}
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
    INSERT INTO recicladoras
    (
        id_usuario,
        nit_empresa,
        nombre_empresa,
        direccion_empresa,
        telefono_empresa,
        camara_comercio,
        id_estado,
        horario,
        dias_trabajo,
        hora_inicio,
        hora_fin,
        dias_no_trabaja,
        estado_validacion_nit,
        estado_camara_comercio
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    cursor.execute(sql, (
        id_usuario,
        nit_empresa,
        nombre_empresa,
        direccion_empresa,
        telefono_empresa,
        camara_comercio,
        id_estado,
        datos_extra.get("horario"),
        datos_extra.get("dias_trabajo"),
        datos_extra.get("hora_inicio"),
        datos_extra.get("hora_fin"),
        datos_extra.get("dias_no_trabaja"),
        datos_extra.get("estado_validacion_nit", "pendiente"),
        datos_extra.get("estado_camara_comercio", "pendiente"),
    ))
    conexion.commit()

    cursor.close()
    conexion.close()


def buscar_recicladora_por_nit(nit_empresa):
    """
    Busca si el NIT ya pertenece a una recicladora registrada.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()
    cursor.execute(
        """
        SELECT id_recicladora, nit_empresa, nombre_empresa
        FROM recicladoras
        WHERE nit_empresa = %s
        LIMIT 1
        """,
        (nit_empresa,),
    )
    recicladora = cursor.fetchone()
    cursor.close()
    conexion.close()
    return recicladora
def asociar_punto_a_recicladora(id_usuario, id_punto):
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    if _tabla_tiene_columna(cursor, "recicladoras", "id_punto"):
        cursor.execute(
            "UPDATE recicladoras SET id_punto = %s WHERE id_usuario = %s",
            (id_punto, id_usuario),
        )
        conexion.commit()

    cursor.close()
    conexion.close()
def listar_recicladoras():
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    cursor.execute("""
    SELECT
        usuarios.id_usuario,
        usuarios.nombres,
        usuarios.apellidos,
        usuarios.correo,
        usuarios.usuario,
        usuarios.numero_documento,
        usuarios.celular,
        usuarios.fecha_registro,
        usuarios.id_estado,
        recicladoras.id_recicladora,
        COALESCE(NULLIF(recicladoras.nit_empresa, ''), usuarios.numero_documento) AS nit_empresa,
        COALESCE(NULLIF(recicladoras.nombre_empresa, ''), '') AS nombre_empresa,
        COALESCE(NULLIF(recicladoras.direccion_empresa, ''), 'Direccion pendiente') AS direccion_empresa,
        COALESCE(NULLIF(recicladoras.telefono_empresa, ''), usuarios.celular) AS telefono_empresa,
        COALESCE(recicladoras.camara_comercio, '') AS camara_comercio,
        COALESCE(NULLIF(recicladoras.horario, ''), 'Horario pendiente') AS horario,
        recicladoras.dias_trabajo,
        recicladoras.hora_inicio,
        recicladoras.hora_fin,
        recicladoras.dias_no_trabaja,
        COALESCE(NULLIF(recicladoras.estado_validacion_nit, ''), 'pendiente') AS estado_validacion_nit,
        COALESCE(NULLIF(recicladoras.estado_camara_comercio, ''), 'pendiente') AS estado_camara_comercio,
        CASE
            WHEN recicladoras.id_recicladora IS NULL THEN TRUE
            ELSE FALSE
        END AS registro_incompleto,
        CASE
            WHEN recicladoras.id_recicladora IS NULL THEN TRUE
            ELSE FALSE
        END AS registro_empresarial_incompleto
    FROM usuarios
    LEFT JOIN recicladoras ON usuarios.id_usuario = recicladoras.id_usuario
    WHERE usuarios.id_rol = 2
    ORDER BY usuarios.fecha_registro DESC, usuarios.id_usuario DESC
    """)
    recicladoras = cursor.fetchall()

    cursor.close()
    conexion.close()
    return recicladoras


def actualizar_validacion_recicladora(id_usuario, estado_camara_comercio):
    """
    Actualiza la validacion documental de una recicladora.

    Al aprobar la Camara de Comercio, la cuenta, la recicladora y su punto
    ecologico quedan activos. Al rechazarla o devolverla a pendiente, quedan
    inactivos hasta nueva revision.
    """

    id_estado = 1 if estado_camara_comercio == "validado" else 2
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    cursor.execute(
        """
        UPDATE recicladoras
        SET estado_camara_comercio = %s,
            estado_validacion_nit = CASE
                WHEN %s = 'validado' THEN 'validado'
                WHEN %s = 'rechazado' THEN 'rechazado'
                ELSE estado_validacion_nit
            END,
            id_estado = %s
        WHERE id_usuario = %s
        RETURNING id_recicladora, id_usuario, id_punto, nombre_empresa, direccion_empresa, telefono_empresa, camara_comercio
        """,
        (
            estado_camara_comercio,
            estado_camara_comercio,
            estado_camara_comercio,
            id_estado,
            id_usuario,
        ),
    )
    recicladora = cursor.fetchone()

    if recicladora:
        cursor.execute(
            "UPDATE usuarios SET id_estado = %s WHERE id_usuario = %s",
            (id_estado, id_usuario),
        )
        if recicladora.get("id_punto"):
            cursor.execute(
                """
                UPDATE puntos_reciclaje
                SET id_estado = %s,
                    nombre = COALESCE(NULLIF(nombre, ''), %s),
                    direccion = CASE
                        WHEN direccion IS NULL
                          OR TRIM(direccion) = ''
                          OR LOWER(direccion) LIKE '%%pendiente%%'
                          OR LOWER(direccion) LIKE '%%por confirmar%%'
                        THEN COALESCE(NULLIF(%s, ''), direccion)
                        ELSE direccion
                    END,
                    telefono = COALESCE(NULLIF(telefono, ''), %s),
                    responsable = COALESCE(NULLIF(responsable, ''), %s)
                WHERE id_punto = %s
                """,
                (
                    id_estado,
                    recicladora.get("nombre_empresa"),
                    recicladora.get("direccion_empresa"),
                    recicladora.get("telefono_empresa"),
                    recicladora.get("nombre_empresa"),
                    recicladora["id_punto"],
                ),
            )

    conexion.commit()
    cursor.close()
    conexion.close()
    return recicladora


def buscar_recicladora_por_usuario(id_usuario):
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    tiene_id_punto = _tabla_tiene_columna(cursor, "recicladoras", "id_punto")
    id_punto_select = "recicladoras.id_punto," if tiene_id_punto else "puntos_reciclaje.id_punto,"
    id_punto_join = (
        """
        LEFT JOIN puntos_reciclaje
            ON recicladoras.id_punto = puntos_reciclaje.id_punto
            OR (
                recicladoras.id_punto IS NULL
                AND (
                    NULLIF(TRIM(puntos_reciclaje.telefono), '') IN (
                        NULLIF(TRIM(recicladoras.telefono_empresa), ''),
                        NULLIF(TRIM(usuarios.celular), '')
                    )
                    OR LOWER(TRIM(puntos_reciclaje.responsable)) = LOWER(TRIM(CONCAT(usuarios.nombres, ' ', usuarios.apellidos)))
                    OR LOWER(TRIM(puntos_reciclaje.responsable)) = LOWER(TRIM(usuarios.nombres))
                )
            )
        """
        if tiene_id_punto else
        """
        LEFT JOIN puntos_reciclaje
            ON LOWER(TRIM(puntos_reciclaje.nombre)) = LOWER(TRIM(recicladoras.nombre_empresa))
            OR LOWER(TRIM(puntos_reciclaje.direccion)) = LOWER(TRIM(recicladoras.direccion_empresa))
        """
    )

    cursor.execute(f"""
    SELECT
        usuarios.id_usuario,
        usuarios.nombres,
        usuarios.apellidos,
        usuarios.correo,
        usuarios.usuario,
        usuarios.numero_documento,
        usuarios.celular,
        usuarios.fecha_registro,
        usuarios.id_estado AS id_estado_usuario,
        recicladoras.id_recicladora,
        recicladoras.nit_empresa,
        COALESCE(NULLIF(recicladoras.nombre_empresa, ''), NULLIF(puntos_reciclaje.nombre, '')) AS nombre_empresa,
        COALESCE(NULLIF(recicladoras.direccion_empresa, ''), NULLIF(puntos_reciclaje.direccion, '')) AS direccion_empresa,
        COALESCE(NULLIF(recicladoras.telefono_empresa, ''), NULLIF(puntos_reciclaje.telefono, ''), usuarios.celular) AS telefono_empresa,
        recicladoras.camara_comercio,
        recicladoras.horario AS horario_recicladora,
        recicladoras.dias_trabajo,
        recicladoras.hora_inicio,
        recicladoras.hora_fin,
        recicladoras.dias_no_trabaja,
        recicladoras.estado_validacion_nit,
        recicladoras.estado_camara_comercio,
        recicladoras.id_estado AS id_estado_recicladora,
        {id_punto_select}
        puntos_reciclaje.nombre AS nombre_punto,
        puntos_reciclaje.direccion AS direccion_punto,
        puntos_reciclaje.horario,
        puntos_reciclaje.latitud,
        puntos_reciclaje.longitud,
        puntos_reciclaje.telefono AS telefono_punto,
        puntos_reciclaje.responsable,
        puntos_reciclaje.id_estado AS id_estado_punto
    FROM usuarios
    INNER JOIN recicladoras ON usuarios.id_usuario = recicladoras.id_usuario
    {id_punto_join}
    WHERE usuarios.id_usuario = %s
    LIMIT 1
    """, (id_usuario,))
    recicladora = cursor.fetchone()

    cursor.close()
    conexion.close()
    return recicladora


def buscar_punto_por_usuario_recicladora(id_usuario):
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    cursor.execute(
        """
        SELECT
            usuarios.id_usuario,
            usuarios.nombres,
            usuarios.apellidos,
            usuarios.correo,
            usuarios.usuario,
            usuarios.numero_documento,
            usuarios.celular,
            usuarios.fecha_registro,
            usuarios.id_estado AS id_estado_usuario,
            NULL AS id_recicladora,
            usuarios.numero_documento AS nit_empresa,
            puntos_reciclaje.nombre AS nombre_empresa,
            puntos_reciclaje.direccion AS direccion_empresa,
            COALESCE(NULLIF(puntos_reciclaje.telefono, ''), usuarios.celular) AS telefono_empresa,
            '' AS camara_comercio,
            puntos_reciclaje.horario AS horario_recicladora,
            NULL AS dias_trabajo,
            NULL AS hora_inicio,
            NULL AS hora_fin,
            NULL AS dias_no_trabaja,
            'pendiente' AS estado_validacion_nit,
            'pendiente' AS estado_camara_comercio,
            puntos_reciclaje.id_estado AS id_estado_recicladora,
            puntos_reciclaje.id_punto,
            puntos_reciclaje.nombre AS nombre_punto,
            puntos_reciclaje.direccion AS direccion_punto,
            puntos_reciclaje.horario,
            puntos_reciclaje.latitud,
            puntos_reciclaje.longitud,
            puntos_reciclaje.telefono AS telefono_punto,
            puntos_reciclaje.responsable,
            puntos_reciclaje.id_estado AS id_estado_punto
        FROM usuarios
        INNER JOIN puntos_reciclaje
            ON NULLIF(TRIM(puntos_reciclaje.telefono), '') = NULLIF(TRIM(usuarios.celular), '')
            OR LOWER(TRIM(puntos_reciclaje.responsable)) = LOWER(TRIM(CONCAT(usuarios.nombres, ' ', usuarios.apellidos)))
            OR LOWER(TRIM(puntos_reciclaje.responsable)) = LOWER(TRIM(usuarios.nombres))
        WHERE usuarios.id_usuario = %s
          AND usuarios.id_rol = 2
        ORDER BY puntos_reciclaje.id_punto DESC
        LIMIT 1
        """,
        (id_usuario,),
    )
    punto = cursor.fetchone()

    cursor.close()
    conexion.close()
    return punto


def actualizar_perfil_recicladora(id_usuario, datos):
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    cursor.execute(
        """
        UPDATE usuarios
        SET nombres = COALESCE(%s, nombres),
            apellidos = COALESCE(%s, apellidos),
            correo = COALESCE(%s, correo),
            usuario = COALESCE(%s, usuario),
            celular = COALESCE(%s, celular),
            foto_perfil = COALESCE(%s, foto_perfil)
        WHERE id_usuario = %s
        """,
        (
            datos.get("nombres"),
            datos.get("apellidos"),
            datos.get("correo"),
            datos.get("usuario"),
            datos.get("celular"),
            datos.get("foto_perfil"),
            id_usuario,
        ),
    )

    cursor.execute(
        """
        UPDATE recicladoras
        SET nit_empresa = COALESCE(%s, nit_empresa),
            nombre_empresa = COALESCE(%s, nombre_empresa),
            direccion_empresa = COALESCE(%s, direccion_empresa),
            telefono_empresa = COALESCE(%s, telefono_empresa),
            camara_comercio = COALESCE(%s, camara_comercio),
            horario = COALESCE(%s, horario),
            dias_trabajo = COALESCE(%s, dias_trabajo),
            hora_inicio = COALESCE(%s, hora_inicio),
            hora_fin = COALESCE(%s, hora_fin),
            dias_no_trabaja = COALESCE(%s, dias_no_trabaja)
        WHERE id_usuario = %s
        """,
        (
            datos.get("nit_empresa"),
            datos.get("nombre_empresa"),
            datos.get("direccion_empresa"),
            datos.get("telefono_empresa"),
            datos.get("camara_comercio"),
            datos.get("horario"),
            datos.get("dias_trabajo"),
            datos.get("hora_inicio"),
            datos.get("hora_fin"),
            datos.get("dias_no_trabaja"),
            id_usuario,
        ),
    )

    conexion.commit()
    cursor.close()
    conexion.close()
def actualizar_punto_recicladora(id_usuario, datos):
    perfil = buscar_recicladora_por_usuario(id_usuario)
    if not perfil or not perfil.get("id_punto"):
        return False

    conexion = obtener_conexion()
    cursor = conexion.cursor()
    nombre = datos.get("nombre") or datos.get("nombre_empresa")
    direccion = datos.get("direccion") or datos.get("direccion_empresa")
    telefono = datos.get("telefono") or datos.get("telefono_empresa")

    cursor.execute(
        """
        UPDATE puntos_reciclaje
        SET nombre = COALESCE(%s, nombre),
            direccion = COALESCE(%s, direccion),
            horario = COALESCE(%s, horario),
            latitud = COALESCE(%s, latitud),
            longitud = COALESCE(%s, longitud),
            telefono = COALESCE(%s, telefono),
            responsable = COALESCE(%s, responsable)
        WHERE id_punto = %s
        """,
        (
            nombre,
            direccion,
            datos.get("horario"),
            datos.get("latitud"),
            datos.get("longitud"),
            telefono,
            datos.get("responsable"),
            perfil["id_punto"],
        ),
    )

    cursor.execute(
        """
        UPDATE recicladoras
        SET nombre_empresa = COALESCE(%s, nombre_empresa),
            direccion_empresa = COALESCE(%s, direccion_empresa),
            telefono_empresa = COALESCE(%s, telefono_empresa)
        WHERE id_usuario = %s
        """,
        (nombre, direccion, telefono, id_usuario),
    )

    conexion.commit()
    cursor.close()
    conexion.close()
    return True
def cambiar_estado_punto_recicladora(id_usuario, id_estado):
    perfil = buscar_recicladora_por_usuario(id_usuario)
    if not perfil or not perfil.get("id_punto"):
        return False

    conexion = obtener_conexion()
    cursor = conexion.cursor()
    cursor.execute(
        "UPDATE puntos_reciclaje SET id_estado = %s WHERE id_punto = %s",
        (id_estado, perfil["id_punto"]),
    )
    cursor.execute(
        "UPDATE recicladoras SET id_estado = %s WHERE id_usuario = %s",
        (id_estado, id_usuario),
    )
    conexion.commit()
    cursor.close()
    conexion.close()
    return True
def listar_registros_por_recicladora(id_usuario, fecha_inicio=None, fecha_fin=None):
    perfil = buscar_recicladora_por_usuario(id_usuario)
    if not perfil or not perfil.get("id_punto"):
        return []

    conexion = obtener_conexion()
    cursor = conexion.cursor()
    filtros = ["registrar_reciclaje.id_punto = %s"]
    params = [perfil["id_punto"]]

    if fecha_inicio:
        filtros.append("registrar_reciclaje.fecha_hora::date >= %s")
        params.append(fecha_inicio)
    if fecha_fin:
        filtros.append("registrar_reciclaje.fecha_hora::date <= %s")
        params.append(fecha_fin)

    cursor.execute(f"""
        SELECT
            registrar_reciclaje.id_registro,
            registrar_reciclaje.cantidad::float AS cantidad,
            registrar_reciclaje.fecha_hora,
            registrar_reciclaje.puntos_obtenidos,
            registrar_reciclaje.observaciones,
            registrar_reciclaje.id_usuario,
            registrar_reciclaje.id_tipo_material,
            registrar_reciclaje.id_punto,
            registrar_reciclaje.id_estado,
            registrar_reciclaje.motivo_rechazo,
            registrar_reciclaje.fecha_confirmacion,
            registrar_reciclaje.id_recicladora_confirma,
            COALESCE(tipo_material.nombre, 'Material') AS material,
            COALESCE(tipo_material.puntos_por_kg, 0)::float AS puntos_por_kg,
            COALESCE(usuarios.nombres || ' ' || usuarios.apellidos, usuarios.usuario, 'Usuario') AS usuario,
            COALESCE(NULLIF(registrar_reciclaje.estado, ''), estado.descripcion, 'Sin estado') AS estado
        FROM registrar_reciclaje
        LEFT JOIN tipo_material ON registrar_reciclaje.id_tipo_material = tipo_material.id_tipo_material
        LEFT JOIN usuarios ON registrar_reciclaje.id_usuario = usuarios.id_usuario
        LEFT JOIN estado ON registrar_reciclaje.id_estado = estado.id_estado
        WHERE {' AND '.join(filtros)}
        ORDER BY registrar_reciclaje.fecha_hora DESC
    """, tuple(params))
    registros = cursor.fetchall()

    cursor.close()
    conexion.close()
    return registros
def cambiar_estado_registro_recicladora(id_usuario, id_registro, id_estado, puntos_obtenidos=None, motivo_rechazo=None):
    perfil = buscar_recicladora_por_usuario(id_usuario)
    if not perfil or not perfil.get("id_punto"):
        return False

    conexion = obtener_conexion()
    cursor = conexion.cursor()
    cursor.execute(
        """
        UPDATE registrar_reciclaje
        SET id_estado = %s,
            estado = CASE
                WHEN %s = 2 THEN 'confirmado'
                WHEN %s = 3 THEN 'rechazado'
                ELSE COALESCE(estado, 'pendiente')
            END,
            puntos_obtenidos = CASE
                WHEN %s = 2 THEN COALESCE(%s, puntos_obtenidos, 0)
                WHEN %s = 3 THEN 0
                ELSE COALESCE(%s, puntos_obtenidos)
            END,
            puntos_otorgados = CASE
                WHEN %s = 2 THEN COALESCE(%s, puntos_otorgados, 0)
                WHEN %s = 3 THEN 0
                ELSE COALESCE(%s, puntos_otorgados)
            END,
            motivo_rechazo = CASE
                WHEN %s = 3 THEN COALESCE(%s, motivo_rechazo)
                ELSE motivo_rechazo
            END,
            id_recicladora_confirma = %s,
            fecha_confirmacion = CASE
                WHEN %s IN (2, 3) THEN CURRENT_TIMESTAMP
                ELSE fecha_confirmacion
            END
        WHERE id_registro = %s
          AND id_punto = %s
          AND LOWER(COALESCE(estado, 'pendiente')) = 'pendiente'
        """,
        (
            id_estado,
            id_estado,
            id_estado,
            id_estado,
            puntos_obtenidos,
            id_estado,
            puntos_obtenidos,
            id_estado,
            puntos_obtenidos,
            id_estado,
            puntos_obtenidos,
            id_estado,
            motivo_rechazo,
            id_usuario,
            id_estado,
            id_registro,
            perfil["id_punto"],
        ),
    )
    actualizado = cursor.rowcount > 0
    conexion.commit()
    cursor.close()
    conexion.close()
    return actualizado
def listar_materiales_punto_recicladora(id_usuario):
    perfil = buscar_recicladora_por_usuario(id_usuario)
    if not perfil or not perfil.get("id_punto"):
        return []

    conexion = obtener_conexion()
    cursor = conexion.cursor()
    cursor.execute(
        """
        SELECT
            tipo_material.*,
            CASE WHEN punto_material.id_punto_material IS NULL THEN false ELSE true END AS aceptado
        FROM tipo_material
        LEFT JOIN punto_material
            ON tipo_material.id_tipo_material = punto_material.id_tipo_material
           AND punto_material.id_punto = %s
        ORDER BY tipo_material.nombre
        """,
        (perfil["id_punto"],),
    )
    materiales = cursor.fetchall()
    cursor.close()
    conexion.close()
    return materiales
def reemplazar_materiales_punto_recicladora(id_usuario, ids_materiales):
    perfil = buscar_recicladora_por_usuario(id_usuario)
    if not perfil or not perfil.get("id_punto"):
        return False

    conexion = obtener_conexion()
    cursor = conexion.cursor()
    cursor.execute("DELETE FROM punto_material WHERE id_punto = %s", (perfil["id_punto"],))

    for id_material in ids_materiales:
        cursor.execute(
            """
            INSERT INTO punto_material (id_punto, id_tipo_material)
            VALUES (%s, %s)
            ON CONFLICT (id_punto, id_tipo_material) DO NOTHING
            """,
            (perfil["id_punto"], id_material),
        )

    conexion.commit()
    cursor.close()
    conexion.close()
    return True
def listar_novedades_punto_recicladora(id_usuario):
    perfil = buscar_recicladora_por_usuario(id_usuario)
    if not perfil or not perfil.get("id_punto"):
        return []

    conexion = obtener_conexion()
    cursor = conexion.cursor()
    tiene_id_punto = _tabla_tiene_columna(cursor, "novedades", "id_punto")
    tiene_fecha_hora = _tabla_tiene_columna(cursor, "novedades", "fecha_hora")
    fecha = "novedades.fecha_hora" if tiene_fecha_hora else "novedades.fecha_publicacion"
    descripcion = "COALESCE(novedades.comentario, novedades.descripcion)" if _tabla_tiene_columna(cursor, "novedades", "comentario") else "novedades.descripcion"
    titulo = "COALESCE(novedades.motivo, novedades.titulo)" if _tabla_tiene_columna(cursor, "novedades", "motivo") else "novedades.titulo"

    filtro = "WHERE novedades.id_punto = %s" if tiene_id_punto else ""
    params = (perfil["id_punto"],) if tiene_id_punto else ()
    cursor.execute(f"""
        SELECT
            novedades.id_novedad,
            {titulo} AS titulo,
            {descripcion} AS descripcion,
            {fecha} AS fecha,
            novedades.id_usuario,
            novedades.id_estado,
            COALESCE(usuarios.nombres || ' ' || usuarios.apellidos, usuarios.usuario, 'Usuario') AS usuario,
            COALESCE(estado.descripcion, 'Estado') AS estado
        FROM novedades
        LEFT JOIN usuarios ON novedades.id_usuario = usuarios.id_usuario
        LEFT JOIN estado ON novedades.id_estado = estado.id_estado
        {filtro}
        ORDER BY {fecha} DESC
    """, params)
    novedades = cursor.fetchall()
    cursor.close()
    conexion.close()
    return novedades
def responder_novedad_punto_recicladora(id_usuario, id_novedad, datos):
    perfil = buscar_recicladora_por_usuario(id_usuario)
    if not perfil or not perfil.get("id_punto"):
        return False

    conexion = obtener_conexion()
    cursor = conexion.cursor()
    tiene_id_punto = _tabla_tiene_columna(cursor, "novedades", "id_punto")
    tiene_respuesta = _tabla_tiene_columna(cursor, "novedades", "respuesta")

    if tiene_respuesta:
        sql = """
            UPDATE novedades
            SET respuesta = COALESCE(%s, respuesta),
                id_estado = COALESCE(%s, id_estado)
            WHERE id_novedad = %s
        """
        params = [datos.get("respuesta"), datos.get("id_estado"), id_novedad]
    else:
        sql = """
            UPDATE novedades
            SET id_estado = COALESCE(%s, id_estado)
            WHERE id_novedad = %s
        """
        params = [datos.get("id_estado"), id_novedad]

    if tiene_id_punto:
        sql += " AND id_punto = %s"
        params.append(perfil["id_punto"])

    cursor.execute(sql, tuple(params))
    actualizado = cursor.rowcount > 0
    conexion.commit()
    cursor.close()
    conexion.close()
    return actualizado
def obtener_estadisticas_recicladora(id_usuario, fecha_inicio=None, fecha_fin=None):
    perfil = buscar_recicladora_por_usuario(id_usuario)
    if not perfil or not perfil.get("id_punto"):
        return {"total_kg": 0, "registros": 0, "por_material": [], "mensual": [], "ranking_usuarios": []}

    conexion = obtener_conexion()
    cursor = conexion.cursor()
    filtros = ["registrar_reciclaje.id_punto = %s"]
    params = [perfil["id_punto"]]

    if fecha_inicio:
        filtros.append("registrar_reciclaje.fecha_hora::date >= %s")
        params.append(fecha_inicio)
    if fecha_fin:
        filtros.append("registrar_reciclaje.fecha_hora::date <= %s")
        params.append(fecha_fin)

    where = " AND ".join(filtros)

    cursor.execute(
        f"""
        SELECT COUNT(*)::int AS registros,
               COALESCE(SUM(cantidad), 0)::float AS total_kg
        FROM registrar_reciclaje
        WHERE {where}
        """,
        tuple(params),
    )
    resumen = cursor.fetchone() or {}

    cursor.execute(
        f"""
        SELECT COALESCE(tipo_material.nombre, 'Material') AS material,
               COALESCE(SUM(registrar_reciclaje.cantidad), 0)::float AS cantidad
        FROM registrar_reciclaje
        LEFT JOIN tipo_material ON registrar_reciclaje.id_tipo_material = tipo_material.id_tipo_material
        WHERE {where}
        GROUP BY tipo_material.nombre
        ORDER BY cantidad DESC
        """,
        tuple(params),
    )
    por_material = cursor.fetchall()

    cursor.execute(
        f"""
        SELECT TO_CHAR(DATE_TRUNC('month', registrar_reciclaje.fecha_hora), 'YYYY-MM') AS mes,
               COALESCE(SUM(registrar_reciclaje.cantidad), 0)::float AS cantidad
        FROM registrar_reciclaje
        WHERE {where}
        GROUP BY DATE_TRUNC('month', registrar_reciclaje.fecha_hora)
        ORDER BY mes
        """,
        tuple(params),
    )
    mensual = cursor.fetchall()

    cursor.execute(
        f"""
        SELECT registrar_reciclaje.id_usuario,
               COALESCE(usuarios.nombres || ' ' || usuarios.apellidos, usuarios.usuario, 'Usuario') AS usuario,
               COUNT(*)::int AS registros,
               COALESCE(SUM(registrar_reciclaje.cantidad), 0)::float AS cantidad
        FROM registrar_reciclaje
        LEFT JOIN usuarios ON registrar_reciclaje.id_usuario = usuarios.id_usuario
        WHERE {where}
        GROUP BY registrar_reciclaje.id_usuario, usuarios.nombres, usuarios.apellidos, usuarios.usuario
        ORDER BY cantidad DESC
        LIMIT 10
        """,
        tuple(params),
    )
    ranking = cursor.fetchall()

    cursor.close()
    conexion.close()
    return {
        "total_kg": resumen.get("total_kg", 0),
        "registros": resumen.get("registros", 0),
        "por_material": por_material,
        "mensual": mensual,
        "ranking_usuarios": ranking,
    }
def obtener_dashboard_recicladora(id_usuario):
    perfil = buscar_recicladora_por_usuario(id_usuario)
    id_punto = perfil.get("id_punto") if perfil else None

    if not id_punto:
        return {
            "material_recuperado_kg": 0,
            "cargas_activas": 0,
            "recicladores": 0,
            "alertas": 0,
            "puntos": 0,
            "actividad_semanal": [],
            "operaciones_recientes": [],
        }

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    cursor.execute("""
        SELECT
            COALESCE(SUM(cantidad) FILTER (WHERE LOWER(COALESCE(estado, '')) = 'confirmado'), 0)::float AS material_recuperado_kg,
            COUNT(*) FILTER (WHERE LOWER(COALESCE(estado, '')) = 'confirmado')::int AS cargas_activas,
            COUNT(DISTINCT id_usuario) FILTER (WHERE LOWER(COALESCE(estado, '')) = 'confirmado')::int AS recicladores,
            COUNT(*) FILTER (
                WHERE LOWER(COALESCE(estado, '')) NOT IN ('confirmado', 'rechazado')
            )::int AS alertas
        FROM registrar_reciclaje
        WHERE id_punto = %s
    """, (id_punto,))
    resumen = cursor.fetchone()

    cursor.execute("""
        SELECT
            CASE EXTRACT(DOW FROM dia::date)
                WHEN 0 THEN 'Dom'
                WHEN 1 THEN 'Lun'
                WHEN 2 THEN 'Mar'
                WHEN 3 THEN 'Mie'
                WHEN 4 THEN 'Jue'
                WHEN 5 THEN 'Vie'
                WHEN 6 THEN 'Sab'
            END AS dia,
            COALESCE(SUM(registrar_reciclaje.cantidad), 0)::float AS cantidad
        FROM generate_series(
            CURRENT_DATE - INTERVAL '6 days',
            CURRENT_DATE,
            INTERVAL '1 day'
        ) AS dia
        LEFT JOIN registrar_reciclaje
            ON DATE(registrar_reciclaje.fecha_hora) = dia::date
            AND LOWER(COALESCE(registrar_reciclaje.estado, '')) = 'confirmado'
            AND registrar_reciclaje.id_punto = %s
        GROUP BY dia
        ORDER BY dia
    """, (id_punto,))
    actividad = cursor.fetchall()

    cursor.execute("""
        SELECT
            registrar_reciclaje.id_registro,
            registrar_reciclaje.cantidad::float AS cantidad,
            registrar_reciclaje.fecha_hora,
            registrar_reciclaje.id_estado,
            registrar_reciclaje.motivo_rechazo,
            COALESCE(tipo_material.nombre, 'Material') AS material,
            COALESCE(usuarios.nombres || ' ' || usuarios.apellidos, usuarios.usuario, 'Usuario') AS usuario,
            COALESCE(puntos_reciclaje.nombre, 'Punto sin asignar') AS punto,
            COALESCE(NULLIF(registrar_reciclaje.estado, ''), 'Sin estado') AS estado
        FROM registrar_reciclaje
        LEFT JOIN tipo_material ON registrar_reciclaje.id_tipo_material = tipo_material.id_tipo_material
        LEFT JOIN usuarios ON registrar_reciclaje.id_usuario = usuarios.id_usuario
        LEFT JOIN puntos_reciclaje ON registrar_reciclaje.id_punto = puntos_reciclaje.id_punto
        WHERE registrar_reciclaje.id_punto = %s
        ORDER BY registrar_reciclaje.fecha_hora DESC
        LIMIT 5
    """, (id_punto,))
    operaciones = cursor.fetchall()

    cursor.close()
    conexion.close()
    return {
        "material_recuperado_kg": resumen["material_recuperado_kg"] if resumen else 0,
        "cargas_activas": resumen["cargas_activas"] if resumen else 0,
        "recicladores": resumen["recicladores"] if resumen else 0,
        "alertas": resumen["alertas"] if resumen else 0,
        "puntos": 1,
        "actividad_semanal": actividad,
        "operaciones_recientes": operaciones,
    }
