# Archivo: recicladoras_model.py
# Este archivo se encarga de hablar directamente con la tabla recicladoras.
# Aqui guardamos los datos de la empresa del dueno de punto ecologico.

from app.common.database import obtener_conexion


def registrar_recicladora(id_usuario, nit_empresa, nombre_empresa, direccion_empresa, telefono_empresa, camara_comercio, id_estado):
    """
    Registra los datos de la recicladora o punto ecologico.

    id_usuario:
    Es el ID del usuario que ya fue creado en la tabla usuarios.

    nit_empresa:
    Es el identificador legal de la empresa.

    camara_comercio:
    Puede ser una ruta o nombre del archivo de camara de comercio.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
    INSERT INTO recicladoras
    (id_usuario, nit_empresa, nombre_empresa, direccion_empresa, telefono_empresa, camara_comercio, id_estado)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    """

    datos = (
        id_usuario,
        nit_empresa,
        nombre_empresa,
        direccion_empresa,
        telefono_empresa,
        camara_comercio,
        id_estado
    )

    cursor.execute(sql, datos)
    conexion.commit()

    cursor.close()
    conexion.close()


def listar_recicladoras():
    """
    Lista los duenos de recicladora con sus datos personales y datos de empresa.

    Hacemos JOIN porque:
    - usuarios tiene los datos personales.
    - recicladoras tiene los datos de la empresa.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
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
        recicladoras.nit_empresa,
        recicladoras.nombre_empresa,
        recicladoras.direccion_empresa,
        recicladoras.telefono_empresa,
        recicladoras.camara_comercio
    FROM usuarios
    INNER JOIN recicladoras
    ON usuarios.id_usuario = recicladoras.id_usuario
    WHERE usuarios.id_rol = 2
    """

    cursor.execute(sql)
    recicladoras = cursor.fetchall()

    cursor.close()
    conexion.close()

    return recicladoras


def buscar_recicladora_por_usuario(id_usuario):
    """
    Busca la recicladora asociada a un usuario dueno.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
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
        recicladoras.nombre_empresa,
        recicladoras.direccion_empresa,
        recicladoras.telefono_empresa,
        recicladoras.camara_comercio,
        recicladoras.id_estado AS id_estado_recicladora
    FROM usuarios
    INNER JOIN recicladoras
    ON usuarios.id_usuario = recicladoras.id_usuario
    WHERE usuarios.id_usuario = %s
    """

    cursor.execute(sql, (id_usuario,))
    recicladora = cursor.fetchone()

    cursor.close()
    conexion.close()

    return recicladora


def obtener_dashboard_recicladora(id_usuario):
    """
    Calcula indicadores reales para el panel del dueno de recicladora.
    Por ahora usa registros confirmados/activos de la tabla registrar_reciclaje.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    cursor.execute("""
        SELECT
            COALESCE(SUM(cantidad), 0)::float AS material_recuperado_kg,
            COUNT(*)::int AS cargas_activas,
            COUNT(DISTINCT id_usuario)::int AS recicladores,
            0::int AS alertas
        FROM registrar_reciclaje
        WHERE id_estado = 1
    """)
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
            AND registrar_reciclaje.id_estado = 1
        GROUP BY dia
        ORDER BY dia
    """)
    actividad = cursor.fetchall()

    cursor.execute("""
        SELECT
            registrar_reciclaje.id_registro,
            registrar_reciclaje.cantidad,
            registrar_reciclaje.fecha_hora,
            registrar_reciclaje.id_estado,
            COALESCE(tipo_material.nombre, 'Material') AS material,
            COALESCE(usuarios.nombres || ' ' || usuarios.apellidos, usuarios.usuario, 'Usuario') AS usuario,
            COALESCE(puntos_reciclaje.nombre, 'Punto sin asignar') AS punto
        FROM registrar_reciclaje
        LEFT JOIN tipo_material
            ON registrar_reciclaje.id_tipo_material = tipo_material.id_tipo_material
        LEFT JOIN usuarios
            ON registrar_reciclaje.id_usuario = usuarios.id_usuario
        LEFT JOIN puntos_reciclaje
            ON registrar_reciclaje.id_punto = puntos_reciclaje.id_punto
        WHERE registrar_reciclaje.id_estado = 1
        ORDER BY registrar_reciclaje.fecha_hora DESC
        LIMIT 5
    """)
    operaciones = cursor.fetchall()

    cursor.execute("""
        SELECT COUNT(*)::int AS puntos
        FROM puntos_reciclaje
        WHERE id_estado = 1
    """)
    puntos = cursor.fetchone()

    cursor.close()
    conexion.close()

    return {
        "material_recuperado_kg": resumen["material_recuperado_kg"] if resumen else 0,
        "cargas_activas": resumen["cargas_activas"] if resumen else 0,
        "recicladores": resumen["recicladores"] if resumen else 0,
        "alertas": resumen["alertas"] if resumen else 0,
        "puntos": puntos["puntos"] if puntos else 0,
        "actividad_semanal": actividad,
        "operaciones_recientes": operaciones
    }
