# Archivo: recicladoras_service.py
# Este archivo contiene la logica para registrar y consultar recicladoras.
# Aqui validamos los datos antes de mandarlos al model.

from app.models.usuarios_model import registrar_usuario
from app.models.recicladoras_model import registrar_recicladora, listar_recicladoras
from app.common.security import cifrar_contrasena


def servicio_registrar_dueno_recicladora(datos):
    """
    Registra un dueno de punto ecologico.

    Este registro guarda datos en dos tablas:

    1. usuarios
       Guarda los datos personales.

    2. recicladoras
       Guarda los datos de la empresa o punto ecologico.

    El dueno siempre tendra:
    id_rol = 2
    """

    nombres = datos.get("nombres")
    apellidos = datos.get("apellidos")
    correo = datos.get("correo")
    usuario = datos.get("usuario")
    contrasena = datos.get("contrasena")
    numero_documento = datos.get("numero_documento")
    celular = datos.get("celular")
    foto_perfil = datos.get("foto_perfil", "")

    id_tipo_documento = datos.get("id_tipo_documento")

    nit_empresa = datos.get("nit_empresa")
    nombre_empresa = datos.get("nombre_empresa")
    direccion_empresa = datos.get("direccion_empresa")
    telefono_empresa = datos.get("telefono_empresa")
    camara_comercio = datos.get("camara_comercio", "")

    if not nombres:
        return {"mensaje": "Los nombres son obligatorios"}, 400

    if not apellidos:
        return {"mensaje": "Los apellidos son obligatorios"}, 400

    if not correo:
        return {"mensaje": "El correo es obligatorio"}, 400

    if not usuario:
        return {"mensaje": "El usuario es obligatorio"}, 400

    if not contrasena:
        return {"mensaje": "La contrasena es obligatoria"}, 400

    if len(contrasena) < 8:
        return {"mensaje": "La contrasena debe tener minimo 8 caracteres"}, 400

    if not numero_documento:
        return {"mensaje": "El numero de documento es obligatorio"}, 400

    if not id_tipo_documento:
        return {"mensaje": "El tipo de documento es obligatorio"}, 400

    if not nit_empresa:
        return {"mensaje": "El NIT de la empresa es obligatorio"}, 400

    if not nombre_empresa:
        return {"mensaje": "El nombre de la empresa es obligatorio"}, 400

    if not direccion_empresa:
        return {"mensaje": "La direccion de la empresa es obligatoria"}, 400

    # Ciframos la contrasena antes de guardarla.
    contrasena_cifrada = cifrar_contrasena(contrasena)

    # Estos valores los ponemos nosotros.
    # No dejamos que el usuario elija su rol.
    id_rol = 2
    id_estado = 1

    id_usuario_creado = registrar_usuario(
        nombres,
        apellidos,
        correo,
        usuario,
        contrasena_cifrada,
        numero_documento,
        celular,
        foto_perfil,
        id_tipo_documento,
        id_rol,
        id_estado
    )

    registrar_recicladora(
        id_usuario_creado,
        nit_empresa,
        nombre_empresa,
        direccion_empresa,
        telefono_empresa,
        camara_comercio,
        id_estado
    )

    return {"mensaje": "Dueno de punto ecologico registrado correctamente"}, 201


def servicio_listar_duenos_recicladora():
    """
    Lista todos los duenos de recicladora con sus datos de empresa.
    """

    recicladoras = listar_recicladoras()

    return recicladoras, 200