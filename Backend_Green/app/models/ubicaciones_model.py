## Archivo: ubicaciones_model.py
## Modelo de datos: contiene consultas SQL y operaciones directas con la base de datos.

# Modelo de puntos de reciclaje.
# Este archivo habla directamente con Supabase/PostgreSQL.

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


def crear_ubicacion(
    nombre,
    direccion,
    horario=None,
    latitud=None,
    longitud=None,
    telefono=None,
    responsable=None,
    id_estado=1
):
    """
    Crea un punto ecologico para mostrarlo en el mapa del administrador.

    Las coordenadas son opcionales. Si no llegan latitud y longitud, el HTML
    del mapa intenta ubicar el punto usando la direccion.
    """
    
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
        INSERT INTO puntos_reciclaje
        (nombre, direccion, horario, latitud, longitud, telefono, responsable, id_estado)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id_punto
    """

    cursor.execute(sql, (
        nombre,
        direccion,
        horario,
        latitud,
        longitud,
        telefono,
        responsable,
        id_estado
    ))

    id_punto = cursor.fetchone()["id_punto"]
    conexion.commit()

    cursor.close()
    conexion.close()

    return id_punto


def listar_ubicaciones():
    """
    Lista todos los puntos ecologicos con los datos publicos de su ficha.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    tiene_id_punto = _tabla_tiene_columna(cursor, "recicladoras", "id_punto")
    recicladora_join = (
        "LEFT JOIN recicladoras ON recicladoras.id_punto = puntos_reciclaje.id_punto"
        if tiene_id_punto else
        """
        LEFT JOIN recicladoras
            ON LOWER(TRIM(puntos_reciclaje.nombre)) = LOWER(TRIM(recicladoras.nombre_empresa))
            OR LOWER(TRIM(puntos_reciclaje.direccion)) = LOWER(TRIM(recicladoras.direccion_empresa))
        """
    )

    cursor.execute(f"""
        SELECT
            puntos_reciclaje.id_punto,
            COALESCE(NULLIF(puntos_reciclaje.nombre, ''), NULLIF(recicladoras.nombre_empresa, ''), 'Punto de reciclaje') AS nombre,
            COALESCE(
                NULLIF(
                    CASE
                        WHEN LOWER(COALESCE(puntos_reciclaje.direccion, '')) LIKE '%%pendiente%%' THEN ''
                        WHEN LOWER(COALESCE(puntos_reciclaje.direccion, '')) LIKE '%%por confirmar%%' THEN ''
                        ELSE puntos_reciclaje.direccion
                    END,
                    ''
                ),
                NULLIF(recicladoras.direccion_empresa, ''),
                'Direccion por confirmar'
            ) AS direccion,
            COALESCE(
                NULLIF(
                    CASE
                        WHEN LOWER(COALESCE(puntos_reciclaje.horario, '')) LIKE '%%pendiente%%' THEN ''
                        WHEN LOWER(COALESCE(puntos_reciclaje.horario, '')) LIKE '%%por confirmar%%' THEN ''
                        ELSE puntos_reciclaje.horario
                    END,
                    ''
                ),
                NULLIF(recicladoras.horario, ''),
                'Horario por confirmar'
            ) AS horario,
            puntos_reciclaje.latitud,
            puntos_reciclaje.longitud,
            COALESCE(NULLIF(puntos_reciclaje.telefono, ''), NULLIF(recicladoras.telefono_empresa, ''), '') AS telefono,
            COALESCE(NULLIF(puntos_reciclaje.responsable, ''), NULLIF(recicladoras.nombre_empresa, ''), '') AS responsable,
            puntos_reciclaje.id_estado,
            COALESCE(usuarios.correo, '') AS correo,
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
        {recicladora_join}
        LEFT JOIN usuarios
            ON usuarios.id_usuario = recicladoras.id_usuario
        GROUP BY
            puntos_reciclaje.id_punto,
            puntos_reciclaje.nombre,
            puntos_reciclaje.direccion,
            puntos_reciclaje.horario,
            puntos_reciclaje.latitud,
            puntos_reciclaje.longitud,
            puntos_reciclaje.telefono,
            puntos_reciclaje.responsable,
            puntos_reciclaje.id_estado,
            recicladoras.nombre_empresa,
            recicladoras.direccion_empresa,
            recicladoras.horario,
            recicladoras.telefono_empresa,
            usuarios.correo
        ORDER BY puntos_reciclaje.id_punto DESC
    """)

    data = cursor.fetchall()

    cursor.close()
    conexion.close()

    return data


def cambiar_estado_ubicacion(id_punto, id_estado):
    """
    Cambia el estado de un punto ecologico existente.

    El administrador usa esta accion para activar o inactivar puntos que ya
    estan registrados en Supabase.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    cursor.execute(
        """
        UPDATE puntos_reciclaje
        SET id_estado = %s
        WHERE id_punto = %s
        """,
        (id_estado, id_punto)
    )
    conexion.commit()

    cursor.close()
    conexion.close()
