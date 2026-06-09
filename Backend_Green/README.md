# Backend GreenUP

Backend de GreenUP construido con Flask y MySQL. Expone endpoints para registro e inicio de sesion, administracion de usuarios, roles, tipos de documento, recicladoras, materiales, tipos de residuo, reciclaje, contenido educativo, novedades, preguntas frecuentes, estadisticas y reportes.

## Tabla de contenido

- [Tecnologias](#tecnologias)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Instalacion local](#instalacion-local)
- [Variables de entorno](#variables-de-entorno)
- [Base de datos](#base-de-datos)
- [Ejecucion](#ejecucion)
- [Documentacion Swagger](#documentacion-swagger)
- [Autenticacion y roles](#autenticacion-y-roles)
- [Mapa rapido de endpoints](#mapa-rapido-de-endpoints)
- [Flujo interno del codigo](#flujo-interno-del-codigo)
- [Archivos de documentacion](#archivos-de-documentacion)
- [Notas tecnicas importantes](#notas-tecnicas-importantes)

## Tecnologias

| Tecnologia | Uso |
| --- | --- |
| Flask | Framework principal de la API |
| flask-cors | Permite peticiones desde frontend/app movil |
| flasgger | Genera documentacion Swagger |
| mysql-connector-python | Conexion directa a MySQL |
| python-dotenv | Carga variables desde `.env` |
| Werkzeug | Cifrado y verificacion de contrasenas |
| PyJWT | Dependencia disponible para tokens, aunque el middleware actual usa headers |
| pandas, openpyxl, reportlab | Preparacion/exportacion de reportes |
| googlemaps | Integracion potencial con mapas |

## Estructura del proyecto

```text
Backend_Green/
  main.py                         # Punto de entrada de Flask
  README.md                       # Guia principal del backend
  requirements.txt                # Dependencias Python
  .env.example                    # Plantilla de variables de entorno
  Data/
    greenup.sql                   # Esquema principal y datos base actuales
    datos_iniciales.sql           # Script antiguo/incompatible con el esquema actual
  app/
    __init__.py                   # Crea la app y registra blueprints
    common/
      config.py                   # Lee variables de entorno
      database.py                 # Crea conexiones MySQL
      security.py                 # Valida, cifra y verifica contrasenas
      swagger.py                  # Configura Flasgger
    controllers/                  # Rutas HTTP y documentacion Swagger por endpoint
    services/                     # Reglas de negocio y validaciones
    models/                       # Consultas SQL directas
    middlewares/
      auth_middleware.py          # Exige headers de sesion
      roles_middleware.py         # Valida roles permitidos
  docs/
    API.md                        # Catalogo de endpoints, headers y cuerpos JSON
    ARCHITECTURE.md               # Explicacion de capas, flujo y base de datos
```

## Instalacion local

Desde PowerShell:

```powershell
cd C:\GreenUP\Backend_Green
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Edita `.env` con las credenciales reales de MySQL.

## Variables de entorno

| Variable | Descripcion | Ejemplo |
| --- | --- | --- |
| `DB_HOST` | Host de MySQL | `127.0.0.1` |
| `DB_PORT` | Puerto de MySQL | `3306` |
| `DB_USER` | Usuario de MySQL | `root` |
| `DB_PASSWORD` | Contrasena de MySQL | `servidor_123` |
| `DB_NAME` | Base de datos usada por la API | `greenup` |
| `ADMIN_ACCESS_CODE` | Codigo extra requerido para login de administrador | `GREENUP-ADMIN-2026` |

## Base de datos

El script principal es:

```text
Data/greenup.sql
```

Ese archivo crea la base de datos `greenup`, las tablas principales y datos iniciales.

Para cargarlo en MySQL:

```powershell
mysql -u root -p < Data\greenup.sql
```

Tablas principales:

| Tabla | Responsabilidad |
| --- | --- |
| `estado` | Estados generales, como activo/inactivo |
| `tipo_documento` | Catalogo de tipos de documento |
| `roles` | Roles del sistema |
| `usuarios` | Usuarios registrados |
| `tipo_residuo` | Clasificacion general de residuos |
| `tipo_material` | Materiales reciclables especificos |
| `puntos_reciclaje` | Ubicaciones fisicas de reciclaje |
| `punto_material` | Relacion entre puntos y materiales aceptados |
| `registrar_reciclaje` | Registros de reciclaje hechos por usuarios |
| `contenido_educativo` | Articulos, videos o recursos educativos |
| `novedades` | Noticias y anuncios |
| `preguntas_frecuentes` | FAQ de la aplicacion |
| `recicladoras` | Datos empresariales de duenos de recicladora |

## Ejecucion

```powershell
cd C:\GreenUP\Backend_Green
.\.venv\Scripts\activate
python main.py
```

Por defecto Flask levanta la API en:

```text
http://127.0.0.1:5000
```

La ruta raiz responde:

```json
{
  "mensaje": "Backend GreenUp funcionando correctamente"
}
```

## Documentacion Swagger

Flasgger queda configurado en `app/common/swagger.py`.

Cuando la app esta corriendo, abre:

```text
http://127.0.0.1:5000/apidocs
```

Varios controladores ya incluyen docstrings Swagger, especialmente:

- `auth_routes.py`
- `usuarios_routes.py`
- `roles_routes.py`
- `tipo_documento_routes.py`
- `recicladoras_routes.py`

## Autenticacion y roles

Hay dos logins:

| Endpoint | Uso |
| --- | --- |
| `POST /api/login` | Login normal para ciudadano o dueno de recicladora |
| `POST /api/admin/login` | Login exclusivo para administradores |

Roles usados por el backend:

| ID | Rol |
| --- | --- |
| `1` | Administrador |
| `2` | Dueno de punto ecologico/recicladora |
| `3` | Ciudadano |

Las rutas protegidas usan los decoradores:

- `@login_requerido`
- `@rol_requerido([...])`

El middleware actual no valida JWT. Espera que el frontend envie estos headers:

```http
id_usuario: 1
id_rol: 1
```

Tambien acepta:

```http
id-usuario: 1
id-rol: 1
```

## Mapa rapido de endpoints

Consulta el detalle completo en [docs/API.md](docs/API.md).

| Modulo | Endpoints principales |
| --- | --- |
| Auth | `/api/login`, `/api/admin/login` |
| Usuarios | `/api/usuarios/registro`, `/api/usuarios/listar`, `/api/usuarios/ciudadanos`, `/api/usuarios/buscar/<id>`, `/api/usuarios/actualizar/<id>`, `/api/usuarios/inhabilitar/<id>` |
| Recicladoras | `/api/recicladoras/registro`, `/api/recicladoras/listar` |
| Roles | `/api/roles/registrar`, `/api/roles/listar`, `/api/roles/buscar/<id>`, `/api/roles/actualizar/<id>`, `/api/roles/inhabilitar/<id>` |
| Tipo documento | `/api/tipo-documento/registrar`, `/api/tipo-documento/listar`, `/api/tipo-documento/buscar/<id>`, `/api/tipo-documento/actualizar/<id>`, `/api/tipo-documento/inhabilitar/<id>` |
| Materiales | `/materiales`, `/materiales/<id>`, `/materiales/<id>/estado` |
| Tipos de residuo | `/tipos-residuo`, `/tipos-residuo/<id>`, `/tipos-residuo/<id>/estado` |
| Reciclaje | `/reciclaje`, `/reciclaje/<id>`, `/reciclaje/<id>/estado` |
| Ubicaciones | `/ubicaciones` |
| Novedades | `/novedades`, `/novedades/<id>`, `/novedades/<id>/estado` |
| Contenido | `/contenido` |
| FAQ | `/faq` |
| Estadisticas | `/estadisticas` |
| Reportes | `/reportes/reciclaje` |

## Flujo interno del codigo

El backend usa una arquitectura por capas:

```text
Peticion HTTP
  -> controller
      -> service
          -> model
              -> MySQL
```

- Los `controllers` reciben la peticion, leen `request.get_json()` y devuelven `jsonify`.
- Los `services` validan datos, aplican reglas de negocio y deciden codigos HTTP.
- Los `models` ejecutan SQL usando `obtener_conexion()`.
- `common/security.py` centraliza validacion y cifrado de contrasenas.
- `middlewares` controla acceso por sesion y rol.

Mas detalle en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Archivos de documentacion

| Archivo | Contenido |
| --- | --- |
| `README.md` | Guia de instalacion, estructura y uso general |
| `docs/API.md` | Endpoints, headers, cuerpos JSON y respuestas esperadas |
| `docs/ARCHITECTURE.md` | Capas internas, responsabilidades, base de datos y notas tecnicas |

## Notas tecnicas importantes

- `Data/greenup.sql` es el script principal recomendado.
- `Data/datos_iniciales.sql` parece antiguo: usa tablas como `usuario`, `punto_reciclaje` y `reciclaje`, pero el esquema actual usa `usuarios`, `puntos_reciclaje` y `registrar_reciclaje`.
- `app/controllers/materiales_routes.py` contiene el bloque de rutas duplicado. Funciona porque al final queda registrado el segundo blueprint, pero conviene limpiar la duplicacion.
- `app/services/materiales_service.py` tiene un error en `servicio_crear_material(data)`: usa `datos` y `dataos` en lugar de `data`. Esa ruta puede fallar al crear materiales hasta que se corrija.
- El middleware de autenticacion confia en headers enviados por el cliente. Para produccion conviene migrar a JWT o sesiones firmadas.
