## Archivo: jwt_config.py
## Modulo comun: centraliza la clave usada para firmar y leer tokens JWT.

import os


def obtener_jwt_secret():
    """
    Devuelve una clave segura para JWT.

    La aplicacion no arranca con una clave ausente o debil. Esto evita firmar
    tokens con valores conocidos incluidos accidentalmente en el codigo.
    """

    secreto = (os.getenv("JWT_SECRET_KEY") or os.getenv("JWT_SECRET") or "").strip()
    if len(secreto.encode("utf-8")) < 32:
        raise RuntimeError(
            "JWT_SECRET_KEY debe estar configurada y tener al menos 32 caracteres"
        )
    return secreto


JWT_ALGORITHM = "HS256"
