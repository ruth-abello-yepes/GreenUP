# Backend GreenUP

Backend de GreenUP construido con Flask y PostgreSQL/Supabase. Expone endpoints para registro e inicio de sesion, administracion de usuarios, roles, tipos de documento, recicladoras, materiales, tipos de residuo, reciclaje, contenido educativo, novedades, preguntas frecuentes, estadisticas y reportes.

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
| psycopg2-binary | Conexion directa a PostgreSQL/Supabase |
| python-dotenv | Carga variables desde `.env` |
| Werkzeug | Cifrado y verificacion de contrasenas |
| PyJWT | Crea y valida tokens de inicio de sesion |
| pandas, openpyxl, reportlab | Preparacion/exportacion de reportes |

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
      database.py                 # Crea conexiones PostgreSQL/Supabase
      security.py                 # Valida, cifra y verifica contrasenas
      swagger.py                  # Configura Flasgger
    controllers/                  # Rutas HTTP y documentacion Swagger por endpoint
    services/                     # Reglas de negocio y validaciones
    models/                       # Consultas SQL directas
    middlewares/
      auth_middleware.py          # Valida JWT y deja compatibilidad local controlada
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

Edita `.env` con las credenciales reales de PostgreSQL/Supabase.

## Variables de entorno

| Variable | Descripcion | Ejemplo |
| --- | --- | --- |
| `DATABASE_URL` / `SUPABASE_DB_URL` | URL completa de PostgreSQL/Supabase | `postgresql://...` |
| `DB_HOST` | Host de PostgreSQL/Supabase | `aws-0-us-east-1.pooler.supabase.com` |
| `DB_PORT` | Puerto de PostgreSQL/Supabase | `6543` |
| `DB_USER` | Usuario de PostgreSQL/Supabase | `postgres.xxxxx` |
| `DB_PASSWORD` | Contrasena de PostgreSQL/Supabase | `********` |
| `DB_NAME` | Base de datos usada por la API | `postgres` |
| `ADMIN_ACCESS_CODE` | Codigo extra requerido para login de administrador | `GREENUP-ADMIN-2026` |
| `JWT_SECRET_KEY` | Clave para firmar tokens JWT | `cambia-esto-en-produccion` |
| `CORS_ORIGINS` | Origenes permitidos separados por coma | `https://greenupgrup.netlify.app,http://127.0.0.1:5502` |
| `JWT_EXPIRACION_MINUTOS` | Vigencia maxima del token JWT | `30` |
| `INACTIVIDAD_MINUTOS` | Referencia para cierre por inactividad del cliente | `20` |
| `LOGIN_IP_MAX_INTENTOS` | Solicitudes de login permitidas por IP en la ventana | `20` |
| `LOGIN_IP_VENTANA_SEGUNDOS` | Ventana del limite por IP | `900` |
| `TURNSTILE_SECRET_KEY` | Clave privada de Cloudflare Turnstile; si existe, exige CAPTCHA | `` |
| `TURNSTILE_SITE_KEY` | Clave publica para renderizar Turnstile en los formularios | `` |

## Base de datos

El script principal es:

```text
Data/greenup.sql
```

Ese archivo describe las tablas principales y datos iniciales. En produccion la base usada es PostgreSQL/Supabase.

Para cargarlo en una base PostgreSQL local o en Supabase, usa el editor SQL de Supabase o `psql`:

```powershell
psql "postgresql://usuario:password@host:puerto/postgres" -f Data\greenup.sql
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

El login devuelve un JWT. Las rutas protegidas esperan el token en:

```http
Authorization: Bearer <token>
```

El backend no acepta `id_usuario`/`id_rol` enviados manualmente por headers porque esos valores se pueden falsificar.

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
              -> PostgreSQL/Supabase
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
- La conexion a Supabase usa SSL y puede configurarse con `DATABASE_URL`/`SUPABASE_DB_URL` o variables `DB_*`.
- El middleware valida JWT y no acepta roles enviados manualmente desde el navegador.
- Las politicas RLS de Supabase deben aplicarse con cuidado si se decide consumir tablas directamente desde Supabase Auth/Data API.
