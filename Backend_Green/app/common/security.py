from werkzeug.security import generate_password_hash, check_password_hash


def cifrar_contrasena(contrasena):
    contrasena_cifrada = generate_password_hash(contrasena)
    return contrasena_cifrada


def verificar_contrasena(contrasena, contrasena_cifrada):
    es_correcta = check_password_hash(contrasena_cifrada, contrasena)
    return es_correcta
