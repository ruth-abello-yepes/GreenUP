## Archivo: jwt_config.py
## Modulo comun: centraliza la clave usada para firmar y leer tokens JWT.

import hashlib
import os


def obtener_jwt_secret():
    """
    Devuelve una clave segura para JWT.

    Si la variable del entorno es corta, se deriva con SHA-256 para que HS256
    use una llave de longitud adecuada sin exponer secretos en el codigo.
    """

    secreto = os.getenv("JWT_SECRET") or os.getenv("SECRET_KEY") or "greenup-dev-secret"
    if len(secreto.encode("utf-8")) >= 32:
        return secreto
    return hashlib.sha256(secreto.encode("utf-8")).hexdigest()


JWT_ALGORITHM = "HS256"
