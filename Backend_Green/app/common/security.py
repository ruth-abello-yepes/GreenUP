import re

from werkzeug.security import generate_password_hash, check_password_hash


MENSAJE_CONTRASENA_SEGURA = (
    "La contrasena debe tener minimo 8 caracteres, una letra mayuscula, "
    "una letra minuscula, un numero y un caracter especial"
)


def validar_contrasena_segura(contrasena):
    if not contrasena:
        return False, "La contrasena es obligatoria"

    if len(contrasena) < 8:
        return False, MENSAJE_CONTRASENA_SEGURA

    reglas = (
        re.search(r"[A-Z]", contrasena),
        re.search(r"[a-z]", contrasena),
        re.search(r"\d", contrasena),
        re.search(r"[^A-Za-z0-9\s]", contrasena),
    )

    if not all(reglas):
        return False, MENSAJE_CONTRASENA_SEGURA

    if re.search(r"\s", contrasena):
        return False, "La contrasena no debe contener espacios"

    return True, ""


def cifrar_contrasena(contrasena):
    contrasena_cifrada = generate_password_hash(contrasena)
    return contrasena_cifrada


def verificar_contrasena(contrasena, contrasena_cifrada):
    es_correcta = check_password_hash(contrasena_cifrada, contrasena)
    return es_correcta
