## Archivo: usuarios_model.py
## Modelo de datos: contiene consultas SQL y operaciones directas con la base de datos.

# Archivo: usuarios_model.py
# Este archivo se encarga de hablar directamente con la tabla usuarios.
# Aqui van los INSERT, SELECT, UPDATE de usuarios.

from app.common.database import obtener_conexion


def _tabla_existe(cursor, tabla):
    """Confirma si una tabla auxiliar ya existe en PostgreSQL."""

    cursor.execute(
        """
        SELECT EXISTS(
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = %s
        ) AS existe
        """,
        (tabla,),
    )
    respuesta = cursor.fetchone() or {}
    return bool(respuesta.get("existe"))


def registrar_usuario(nombres, apellidos, correo, usuario, contrasena, numero_documento, celular, foto_perfil, id_tipo_documento, id_rol, id_estado, genero=None):
    """
    Registra un usuario en la tabla usuarios.

    Este mismo metodo sirve para:
    - Administrador del sistema
    - Dueno de punto ecologico
    - Ciudadano

    La diferencia la marca el id_rol:
    1 = Administrador
    2 = Dueno de punto ecologico
    3 = Ciudadano
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
    INSERT INTO usuarios
    (nombres, apellidos, correo, usuario, contrasena, numero_documento, celular, foto_perfil, id_tipo_documento, id_rol, id_estado, genero)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    RETURNING id_usuario
    """

    datos = (
        nombres,
        apellidos,
        correo,
        usuario,
        contrasena,
        numero_documento,
        celular,
        foto_perfil,
        id_tipo_documento,
        id_rol,
        id_estado,
        genero
    )

    cursor.execute(sql, datos)

    # En Supabase/PostgreSQL usamos RETURNING para saber el ID creado.
    # cursor.lastrowid era de MySQL y no funciona con psycopg2.
    id_usuario_creado = cursor.fetchone()["id_usuario"]
    conexion.commit()

    cursor.close()
    conexion.close()

    return id_usuario_creado


def listar_usuarios():
    """
    Lista todos los usuarios registrados.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    columnas_publicas = """
        usuarios.id_usuario,
        usuarios.nombres,
        usuarios.apellidos,
        usuarios.correo,
        usuarios.usuario,
        usuarios.numero_documento,
        usuarios.celular,
        usuarios.foto_perfil,
        usuarios.id_tipo_documento,
        usuarios.id_rol,
        usuarios.id_estado
    """

    if _tabla_existe(cursor, "ciudadano_puntos_juego"):
        sql = """
        SELECT
            {columnas_publicas},
            COALESCE(puntos.puntos_juego, 0) AS puntos_juego,
            COALESCE(puntos.noticias_juego, 0) AS noticias_juego
        FROM usuarios
        LEFT JOIN (
            SELECT
                id_usuario,
                MAX(COALESCE(puntos_total, 0)) AS puntos_juego,
                MAX(COALESCE(noticias_completadas, 0)) AS noticias_juego
            FROM ciudadano_puntos_juego
            GROUP BY id_usuario
        ) puntos
          ON puntos.id_usuario = usuarios.id_usuario
        ORDER BY usuarios.id_usuario DESC
        """.format(columnas_publicas=columnas_publicas)
    else:
        sql = f"""
        SELECT
            {columnas_publicas},
            0 AS puntos_juego,
            0 AS noticias_juego
        FROM usuarios
        ORDER BY usuarios.id_usuario DESC
        """

    cursor.execute(sql)
    usuarios = cursor.fetchall()

    cursor.close()
    conexion.close()

    return usuarios


def listar_ciudadanos():
    """
    Lista solamente los usuarios que son ciudadanos.

    id_rol = 3 significa Ciudadano.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    if _tabla_existe(cursor, "ciudadano_puntos_juego"):
        sql = """
        SELECT
            usuarios.*,
            COALESCE(ciudadano_puntos_juego.puntos_total, 0) AS puntos_juego,
            COALESCE(ciudadano_puntos_juego.noticias_completadas, 0) AS noticias_juego
        FROM usuarios
        LEFT JOIN ciudadano_puntos_juego
          ON ciudadano_puntos_juego.id_usuario = usuarios.id_usuario
        WHERE usuarios.id_rol = 3
        """
    else:
        sql = """
        SELECT usuarios.*, 0 AS puntos_juego, 0 AS noticias_juego
        FROM usuarios
        WHERE usuarios.id_rol = 3
        """

    cursor.execute(sql)
    ciudadanos = cursor.fetchall()

    cursor.close()
    conexion.close()

    return ciudadanos


def listar_duenos_recicladora():
    """
    Lista solamente los usuarios que son duenos de punto ecologico.

    id_rol = 2 significa Dueno de punto ecologico.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
    SELECT usuarios.*, 0 AS puntos_juego, 0 AS noticias_juego
    FROM usuarios
    WHERE id_rol = 2
    """

    cursor.execute(sql)
    duenos = cursor.fetchall()

    cursor.close()
    conexion.close()

    return duenos


def buscar_usuario_por_id(id_usuario):
    """
    Busca un usuario por su ID.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    if _tabla_existe(cursor, "ciudadano_puntos_juego"):
        sql = """
        SELECT
            usuarios.*,
            COALESCE(ciudadano_puntos_juego.puntos_total, 0) AS puntos_juego,
            COALESCE(ciudadano_puntos_juego.noticias_completadas, 0) AS noticias_juego
        FROM usuarios
        LEFT JOIN ciudadano_puntos_juego
          ON ciudadano_puntos_juego.id_usuario = usuarios.id_usuario
        WHERE usuarios.id_usuario = %s
        """
    else:
        sql = "SELECT usuarios.*, 0 AS puntos_juego, 0 AS noticias_juego FROM usuarios WHERE id_usuario = %s"

    cursor.execute(sql, (id_usuario,))
    usuario = cursor.fetchone()

    cursor.close()
    conexion.close()

    return usuario


def buscar_usuario_por_usuario(usuario):
    """
    Busca un usuario por su nombre de usuario o correo.

    Esta funcion se usa en el login.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
    SELECT *
    FROM usuarios
    WHERE LOWER(TRIM(usuario)) = LOWER(TRIM(%s))
       OR LOWER(TRIM(correo)) = LOWER(TRIM(%s))
    LIMIT 1
    """

    cursor.execute(sql, (usuario, usuario))
    usuario_encontrado = cursor.fetchone()

    cursor.close()
    conexion.close()

    return usuario_encontrado


def buscar_usuario_por_documento(numero_documento):
    """
    Busca un usuario por documento.

    Se usa antes del registro para devolver un mensaje claro cuando alguien
    intenta crear una cuenta con una cedula o documento ya registrado.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
    SELECT *
    FROM usuarios
    WHERE LOWER(REGEXP_REPLACE(TRIM(numero_documento), '[^0-9A-Za-z]', '', 'g')) =
          LOWER(REGEXP_REPLACE(TRIM(%s), '[^0-9A-Za-z]', '', 'g'))
    LIMIT 1
    """
    cursor.execute(sql, (numero_documento,))
    usuario_encontrado = cursor.fetchone()

    cursor.close()
    conexion.close()

    return usuario_encontrado


def actualizar_usuario(id_usuario, nombres, apellidos, correo, usuario, numero_documento, celular, foto_perfil, id_tipo_documento, id_rol, id_estado):
    """
    Actualiza los datos de un usuario.

    No actualizamos la contrasena aqui.
    La contrasena se debe cambiar en otro metodo aparte.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
    UPDATE usuarios
    SET nombres = %s,
        apellidos = %s,
        correo = %s,
        usuario = %s,
        numero_documento = %s,
        celular = %s,
        foto_perfil = %s,
        id_tipo_documento = %s,
        id_rol = %s,
        id_estado = %s
    WHERE id_usuario = %s
    """

    datos = (
        nombres,
        apellidos,
        correo,
        usuario,
        numero_documento,
        celular,
        foto_perfil,
        id_tipo_documento,
        id_rol,
        id_estado,
        id_usuario
    )

    cursor.execute(sql, datos)
    conexion.commit()

    cursor.close()
    conexion.close()


def inhabilitar_usuario(id_usuario):
    """
    Inhabilita un usuario.

    No lo borra de la base de datos.
    Solo cambia id_estado a 2.

    id_estado = 1 activo
    id_estado = 2 inactivo
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = "UPDATE usuarios SET id_estado = 2 WHERE id_usuario = %s"

    cursor.execute(sql, (id_usuario,))
    conexion.commit()

    cursor.close()
    conexion.close()


def cambiar_estado_usuario(id_usuario, id_estado):
    """
    Activa o inactiva un usuario desde el administrador del sistema.

    id_estado = 1 activo
    id_estado = 2 inactivo
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = "UPDATE usuarios SET id_estado = %s WHERE id_usuario = %s"

    cursor.execute(sql, (id_estado, id_usuario))
    actualizado = cursor.rowcount > 0
    conexion.commit()

    cursor.close()
    conexion.close()

    return actualizado


def obtener_perfil_usuario(id_usuario):
    """
    Obtiene los datos editables del perfil de un usuario autenticado.

    Esta consulta se usa desde la pantalla de ajustes del ciudadano.
    No retorna la contrasena porque ese dato nunca debe viajar al frontend.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
    SELECT id_usuario,
           nombres,
           apellidos,
           correo,
           celular,
           usuario,
           id_rol,
           foto_perfil
    FROM usuarios
    WHERE id_usuario = %s
    """

    cursor.execute(sql, (id_usuario,))
    usuario = cursor.fetchone()

    cursor.close()
    conexion.close()

    return usuario


def buscar_usuario_por_correo_o_usuario_excluyendo_id(correo, usuario, id_usuario):
    """
    Busca si otro usuario ya tiene el mismo correo o nombre de usuario.

    El id_usuario actual se excluye para que la persona pueda guardar su
    propio correo o usuario sin que el sistema lo marque como duplicado.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
    SELECT id_usuario,
           correo,
           usuario
    FROM usuarios
    WHERE (
            LOWER(TRIM(correo)) = LOWER(TRIM(%s))
         OR LOWER(TRIM(usuario)) = LOWER(TRIM(%s))
          )
      AND id_usuario <> %s
    LIMIT 1
    """

    cursor.execute(sql, (correo, usuario, id_usuario))
    usuario_duplicado = cursor.fetchone()

    cursor.close()
    conexion.close()

    return usuario_duplicado


def actualizar_perfil_usuario(id_usuario, nombres, apellidos, correo, celular, usuario, foto_perfil=None):
    """
    Actualiza solamente los datos permitidos desde ajustes de ciudadano.

    No toca rol, estado, documento ni contrasena para evitar cambios
    administrativos desde una pantalla de ciudadano.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    try:
        sql = """
        UPDATE usuarios
        SET nombres = %s,
            apellidos = %s,
            correo = %s,
            celular = %s,
            usuario = %s,
            foto_perfil = COALESCE(%s, foto_perfil)
        WHERE id_usuario = %s
        """

        cursor.execute(sql, (nombres, apellidos, correo, celular, usuario, foto_perfil, id_usuario))
        conexion.commit()

    except Exception:
        conexion.rollback()
        raise

    finally:
        cursor.close()
        conexion.close()


def obtener_usuario_con_contrasena(id_usuario):
    """
    Obtiene el hash de contrasena del usuario autenticado.

    Este dato se usa solo en backend para validar la contrasena actual.
    """

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
    SELECT id_usuario,
           contrasena
    FROM usuarios
    WHERE id_usuario = %s
    """

    cursor.execute(sql, (id_usuario,))
    usuario = cursor.fetchone()

    cursor.close()
    conexion.close()

    return usuario


# =========================================================================
# FUNCIONES NUEVAS PARA LA RECUPERACIÓN DE CONTRASEÑA
# =========================================================================

def buscar_usuario_por_correo(correo):
    """
    Busca un usuario por su dirección de correo electrónico.
    """
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = """
    SELECT *
    FROM usuarios
    WHERE LOWER(TRIM(correo)) = LOWER(TRIM(%s))
    LIMIT 1
    """
    cursor.execute(sql, (correo,))
    usuario = cursor.fetchone()

    cursor.close()
    conexion.close()

    return usuario


def guardar_codigo_recuperacion_db(id_usuario, codigo, expiracion):
    """
    Guarda el código de 6 dígitos generado en la tabla codigos_recuperacion.
    Elimina cualquier código anterior del usuario antes de guardar el nuevo.
    """
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    # 1. Eliminar códigos previos
    cursor.execute("DELETE FROM codigos_recuperacion WHERE id_usuario = %s", (id_usuario,))

    # 2. Insertar nuevo código
    sql = """
    INSERT INTO codigos_recuperacion (id_usuario, codigo, expiracion)
    VALUES (%s, %s, %s)
    """
    cursor.execute(sql, (id_usuario, codigo, expiracion))
    conexion.commit()

    cursor.close()
    conexion.close()


def obtener_codigo_recuperacion_db(id_usuario, codigo):
    """
    Obtiene el registro del código de recuperación para un usuario.
    """
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    sql = "SELECT * FROM codigos_recuperacion WHERE id_usuario = %s AND codigo = %s"
    cursor.execute(sql, (id_usuario, codigo))
    registro_codigo = cursor.fetchone()

    cursor.close()
    conexion.close()

    return registro_codigo


def actualizar_contrasena_db(id_usuario, nueva_contrasena):
    """
    Actualiza la contrasena del usuario y elimina codigos de recuperacion.

    Si ocurre un error, se hace rollback para no dejar la base de datos
    en un estado incompleto.
    """
    conexion = obtener_conexion()
    cursor = conexion.cursor()

    try:
        # 1. Actualizar contrasena.
        sql_update = "UPDATE usuarios SET contrasena = %s WHERE id_usuario = %s"
        cursor.execute(sql_update, (nueva_contrasena, id_usuario))

        # 2. Borrar codigo de recuperacion consumido, si existe.
        cursor.execute("DELETE FROM codigos_recuperacion WHERE id_usuario = %s", (id_usuario,))
        conexion.commit()

    except Exception:
        conexion.rollback()
        raise

    finally:
        cursor.close()
        conexion.close()
