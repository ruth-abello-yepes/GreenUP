## Archivo: main.py
## Punto de entrada del backend: levanta la aplicacion Flask y sus rutas.

import os

from app import crear_app

app = crear_app()


if __name__ == "__main__":
    puerto = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=puerto)
