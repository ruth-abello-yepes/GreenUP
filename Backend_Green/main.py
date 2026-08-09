## Archivo: main.py
## Punto de entrada del backend: levanta la aplicacion Flask y sus rutas.

from app import crear_app
from flask_cors import CORS
app = crear_app()
CORS(app)


if __name__ == "__main__":
    app.run(debug=True)
