# Arquitectura del Backend GreenUP

Este documento explica como esta organizado el codigo y como fluye una peticion desde Flask hasta PostgreSQL/Supabase.

## Resumen

GreenUP Backend es una API Flask con separacion por capas:

```text
main.py
  -> app/crear_app()
      -> controllers
          -> services
              -> models
                  -> common/database.py
                      -> PostgreSQL/Supabase
```

## Entrada de la aplicacion

### `main.py`

Crea la aplicacion con `crear_app()` y la ejecuta en modo debug si se llama directamente:

```python
from app import crear_app

app = crear_app()

if __name__ == "__main__":
    app.run(debug=True)
```

### `app/__init__.py`

Responsabilidades:

- Crear la instancia `Flask`.
- Activar CORS.
- Configurar Swagger con `configurar_swagger(app)`.
- Registrar todos los blueprints.
- Definir la ruta raiz `/`.

Blueprints registrados:

| Blueprint | Archivo | Area |
| --- | --- | --- |
| `usuarios_bp` | `controllers/usuarios_routes.py` | Usuarios |
| `tipo_documento_bp` | `controllers/tipo_documento_routes.py` | Catalogo de documentos |
| `roles_bp` | `controllers/roles_routes.py` | Roles |
| `auth_bp` | `controllers/auth_routes.py` | Login normal/admin |
| `ubicaciones_bp` | `controllers/ubicaciones_routes.py` | Puntos de reciclaje |
| `reciclaje_bp` | `controllers/reciclaje_routes.py` | Registros de reciclaje |
| `novedades_bp` | `controllers/novedades_routes.py` | Noticias/anuncios |
| `contenido_bp` | `controllers/contenido_routes.py` | Contenido educativo |
| `faq_bp` | `controllers/faq_routes.py` | Preguntas frecuentes |
| `estadisticas_bp` | `controllers/estadisticas_routes.py` | Indicadores |
| `reportes_bp` | `controllers/reportes_routes.py` | Reportes |
| `materiales_bp` | `controllers/materiales_routes.py` | Materiales reciclables |
| `tipos_residuo_bp` | `controllers/tipos_residuo_routes.py` | Tipos de residuo |
| `recicladoras_bp` | `controllers/recicladoras_routes.py` | Duenos de recicladora |

## Capa `common`

| Archivo | Responsabilidad |
| --- | --- |
| `config.py` | Carga `.env` con `load_dotenv()` y expone variables de PostgreSQL/Supabase |
| `database.py` | Abre conexiones con `psycopg2.connect()` |
| `security.py` | Valida contrasenas seguras, cifra hashes y verifica hashes |
| `swagger.py` | Inicializa Flasgger y datos basicos de la API |

### Seguridad de contrasenas

`validar_contrasena_segura(contrasena)` exige:

- Minimo 8 caracteres.
- Una mayuscula.
- Una minuscula.
- Un numero.
- Un caracter especial.
- Sin espacios.

`cifrar_contrasena(contrasena)` usa `generate_password_hash`.

`verificar_contrasena(contrasena, contrasena_cifrada)` usa `check_password_hash`.

## Middlewares

### `login_requerido`

Archivo: `app/middlewares/auth_middleware.py`

Valida el JWT enviado por el frontend en:

```http
Authorization: Bearer <token>
```

Si el token es valido, guarda en `flask.g`:

```python
g.id_usuario
g.id_rol
```

Si falta la autenticacion valida, devuelve `401`.

### `rol_requerido`

Archivo: `app/middlewares/roles_middleware.py`

Recibe una lista de roles permitidos:

```python
@rol_requerido([1])
```

Si `g.id_rol` no esta permitido, devuelve `403`.

## Capas por modulo

Cada modulo suele tener tres archivos:

```text
controllers/<modulo>_routes.py
services/<modulo>_service.py
models/<modulo>_model.py
```

### Controllers

Responsabilidades:

- Definir rutas y metodos HTTP.
- Leer `request.get_json()`.
- Llamar al servicio.
- Devolver `jsonify(respuesta), estado`.
- En algunos archivos, incluir docstrings Swagger.

### Services

Responsabilidades:

- Validar campos obligatorios.
- Aplicar reglas de negocio.
- Definir codigos HTTP.
- Llamar al modelo.

Ejemplos de reglas:

- Ciudadanos se registran siempre con `id_rol = 3`.
- Duenos de recicladora se registran siempre con `id_rol = 2`.
- Usuarios y duenos se crean activos con `id_estado = 1`.
- Las contrasenas se validan y cifran antes de guardarse.

### Models

Responsabilidades:

- Abrir conexion con `obtener_conexion()`.
- Crear cursores, normalmente `dictionary=True` para consultas.
- Ejecutar SQL.
- Hacer `commit()` en escrituras.
- Cerrar cursor y conexion.

## Modulos y responsabilidades

| Modulo | Controller | Service | Model | Responsabilidad |
| --- | --- | --- | --- | --- |
| Auth | `auth_routes.py` | `auth_service.py` | `usuarios_model.py` | Login normal y admin |
| Usuarios | `usuarios_routes.py` | `usuarios_service.py` | `usuarios_model.py` | CRUD de usuarios |
| Recicladoras | `recicladoras_routes.py` | `recicladoras_service.py` | `recicladoras_model.py`, `usuarios_model.py` | Registro de duenos y empresas |
| Roles | `roles_routes.py` | `roles_service.py` | `roles_model.py` | Catalogo de roles |
| Tipo documento | `tipo_documento_routes.py` | `tipo_documento_service.py` | `tipo_documento_model.py` | Catalogo de documentos |
| Materiales | `materiales_routes.py` | `materiales_service.py` | `materiales_model.py` | Materiales reciclables |
| Tipos residuo | `tipos_residuo_routes.py` | `tipos_residuo_service.py` | `tipos_residuo_model.py` | Clasificacion de residuos |
| Reciclaje | `reciclaje_routes.py` | `reciclaje_service.py` | `reciclaje_model.py` | Registro de actividad de reciclaje |
| Ubicaciones | `ubicaciones_routes.py` | `ubicaciones_service.py` | `ubicaciones_model.py` | Puntos de reciclaje |
| Novedades | `novedades_routes.py` | `novedades_service.py` | `novedades_model.py` | Noticias/anuncios |
| Contenido | `contenido_routes.py` | `contenido_service.py` | `contenido_model.py` | Contenido educativo |
| FAQ | `faq_routes.py` | `faq_service.py` | `faq_model.py` | Preguntas frecuentes |
| Estadisticas | `estadisticas_routes.py` | `estadisticas_service.py` | `estadisticas_model.py` | Totales e indicadores |
| Reportes | `reportes_routes.py` | `reportes_service.py` | `reportes_model.py` | Datos consolidados |

## Funciones principales por capa

### Common y middlewares

| Funcion | Archivo | Uso |
| --- | --- | --- |
| `obtener_conexion()` | `common/database.py` | Abre conexion PostgreSQL/Supabase |
| `configurar_swagger(app)` | `common/swagger.py` | Configura Flasgger |
| `validar_contrasena_segura(contrasena)` | `common/security.py` | Valida reglas de contrasena |
| `cifrar_contrasena(contrasena)` | `common/security.py` | Genera hash |
| `verificar_contrasena(contrasena, hash)` | `common/security.py` | Verifica hash |
| `login_requerido(funcion)` | `middlewares/auth_middleware.py` | Protege rutas con JWT |
| `rol_requerido(roles_permitidos)` | `middlewares/roles_middleware.py` | Protege rutas por rol |

### Services destacados

| Funcion | Uso |
| --- | --- |
| `servicio_login(datos)` | Login de ciudadano/dueno |
| `servicio_login_admin(datos)` | Login de administrador con codigo |
| `servicio_registrar_usuario(datos)` | Crea ciudadano |
| `servicio_registrar_dueno_recicladora(datos)` | Crea usuario dueno y recicladora |
| `servicio_listar_usuarios()` | Lista todos los usuarios |
| `servicio_crear_reciclaje(data)` | Crea registro de reciclaje |
| `servicio_ver_estadisticas()` | Devuelve totales de reciclaje |
| `servicio_reporte_reciclaje()` | Devuelve datos para reporte |

## Base de datos

Script principal:

```text
Data/greenup.sql
```

Relaciones clave:

- `usuarios.id_tipo_documento -> tipo_documento.id_tipo_documento`
- `usuarios.id_rol -> roles.id_rol`
- `usuarios.id_estado -> estado.id_estado`
- `tipo_material.id_tipo_residuo -> tipo_residuo.id_tipo_residuo`
- `tipo_material.id_estado -> estado.id_estado`
- `puntos_reciclaje.id_estado -> estado.id_estado`
- `punto_material.id_punto -> puntos_reciclaje.id_punto`
- `punto_material.id_tipo_material -> tipo_material.id_tipo_material`
- `registrar_reciclaje.id_usuario -> usuarios.id_usuario`
- `registrar_reciclaje.id_tipo_material -> tipo_material.id_tipo_material`
- `registrar_reciclaje.id_punto -> puntos_reciclaje.id_punto`
- `contenido_educativo.id_usuario -> usuarios.id_usuario`
- `novedades.id_usuario -> usuarios.id_usuario`
- `recicladoras.id_usuario -> usuarios.id_usuario`

## Convenciones de respuesta

Los servicios retornan casi siempre:

```python
return respuesta, estado_http
```

Los controllers devuelven:

```python
return jsonify(respuesta), estado
```

Ejemplos:

```json
{
  "mensaje": "Usuario actualizado correctamente"
}
```

```json
{
  "mensaje": "Usuario no encontrado"
}
```

## Como agregar un modulo nuevo

1. Crear `app/models/<modulo>_model.py` con consultas SQL.
2. Crear `app/services/<modulo>_service.py` con validaciones y reglas.
3. Crear `app/controllers/<modulo>_routes.py` con blueprint y rutas.
4. Importar el blueprint en `app/__init__.py`.
5. Registrar el blueprint con `app.register_blueprint(...)`.
6. Documentar endpoints en Swagger y en `docs/API.md`.

## Notas tecnicas detectadas

Estas notas no cambian el comportamiento actual, pero ayudan a mantener el backend:

1. `Data/datos_iniciales.sql` parece antiguo y no coincide con el esquema actual.
2. Algunas rutas usan prefijo `/api`, otras no. Se recomienda unificar a futuro para facilitar frontend y documentacion.
3. Las politicas RLS de Supabase protegen accesos por Supabase Data API; el backend Flask sigue validando permisos con JWT y roles.
4. Si se adopta Supabase Auth de forma directa, se debe enlazar `usuarios.auth_user_id` con `auth.users.id`.

## Verificacion rapida

Probar que Flask puede crear la app:

```powershell
cd C:\GreenUP\Backend_Green
.\.venv\Scripts\python.exe -B -c "from app import crear_app; app = crear_app(); print('OK Flask app creada')"
```

Listar rutas registradas:

```powershell
.\.venv\Scripts\python.exe -B -c "from app import crear_app; app = crear_app(); print(app.url_map)"
```
