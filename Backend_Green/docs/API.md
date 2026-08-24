# API Backend GreenUP

Esta guia resume los endpoints disponibles en el backend Flask.

Base local recomendada:

```text
http://127.0.0.1:5000
```

Importante: las rutas no usan un prefijo unico. Algunas empiezan con `/api` y otras estan directamente en la raiz (`/materiales`, `/faq`, `/contenido`, etc.). Usa exactamente las rutas indicadas.

## Headers para rutas protegidas

Las rutas protegidas por `@login_requerido` y `@rol_requerido` esperan un JWT:

```http
Authorization: Bearer <token>
```

El rol no se debe enviar manualmente desde el navegador. El backend lo lee desde el token firmado. Rol administrador:

```text
id_rol = 1
```

## Auth

### POST `/api/login`

Login para ciudadano o dueno de punto ecologico. No permite login de administrador.

Body:

```json
{
  "usuario": "ciudadano1",
  "contrasena": "GreenUp2026!"
}
```

Respuestas comunes:

| Estado | Significado |
| --- | --- |
| `200` | Login correcto |
| `400` | Faltan usuario o contrasena |
| `401` | Contrasena incorrecta |
| `403` | Usuario inactivo o administrador usando login normal |
| `404` | Usuario no encontrado |

### POST `/api/admin/login`

Login exclusivo para administrador. Requiere codigo adicional desde `.env`.

Body:

```json
{
  "usuario": "admin",
  "contrasena": "GreenUp2026!",
  "codigo_admin": "GREENUP-ADMIN-2026"
}
```

## Usuarios

Blueprint: `usuarios_bp` con `url_prefix="/api/usuarios"`.

| Metodo | Ruta | Protegida | Descripcion |
| --- | --- | --- | --- |
| POST | `/api/usuarios/registro` | No | Registra ciudadano |
| GET | `/api/usuarios/listar` | Si, admin | Lista todos los usuarios |
| GET | `/api/usuarios/ciudadanos` | Si, admin | Lista usuarios con rol ciudadano |
| GET | `/api/usuarios/buscar/<id_usuario>` | Si, admin | Busca usuario por ID |
| PUT | `/api/usuarios/actualizar/<id_usuario>` | Si, admin | Actualiza usuario |
| DELETE | `/api/usuarios/inhabilitar/<id_usuario>` | Si, admin | Cambia usuario a inactivo |

Registro de ciudadano:

```json
{
  "nombres": "Oreste Junior",
  "apellidos": "Suarez Leguia",
  "correo": "oreste@gmail.com",
  "usuario": "oreste",
  "contrasena": "GreenUp2026!",
  "numero_documento": "1234567890",
  "celular": "3001234567",
  "foto_perfil": "",
  "id_tipo_documento": 1
}
```

Reglas del servicio:

- El ciudadano siempre se crea con `id_rol = 3`.
- El ciudadano siempre se crea activo con `id_estado = 1`.
- La contrasena se valida y se cifra antes de guardar.
- El nombre de usuario debe tener minimo 5 caracteres.

Actualizar usuario:

```json
{
  "nombres": "Anyeli Marian",
  "apellidos": "Chico Arrieta",
  "correo": "anyeli@gmail.com",
  "usuario": "anyeli",
  "numero_documento": "1234567890",
  "celular": "3001234567",
  "foto_perfil": "",
  "id_tipo_documento": 1,
  "id_rol": 3,
  "id_estado": 1
}
```

## Recicladoras

Blueprint: `recicladoras_bp` con `url_prefix="/api/recicladoras"`.

| Metodo | Ruta | Protegida | Descripcion |
| --- | --- | --- | --- |
| POST | `/api/recicladoras/registro` | No | Registra dueno de recicladora y empresa |
| GET | `/api/recicladoras/listar` | Si, admin | Lista duenos con datos de empresa |

Registro:

```json
{
  "nombres": "Ruth Mery",
  "apellidos": "Abello Yepes",
  "correo": "ruth@gmail.com",
  "usuario": "ruthrecicladora",
  "contrasena": "GreenUp2026!",
  "numero_documento": "1234567890",
  "celular": "3001234567",
  "foto_perfil": "",
  "id_tipo_documento": 1,
  "nit_empresa": "900123456-1",
  "nombre_empresa": "Punto Verde Ruth",
  "direccion_empresa": "Calle 10 # 15-20",
  "telefono_empresa": "6051234567",
  "camara_comercio": "camara_ruth.pdf"
}
```

Reglas del servicio:

- Crea primero el usuario.
- Luego crea el registro en `recicladoras`.
- El dueno queda con `id_rol = 2`.
- El registro queda activo con `id_estado = 1`.

## Roles

Blueprint: `roles_bp` con `url_prefix="/api/roles"`.

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| POST | `/api/roles/registrar` | Registra rol |
| GET | `/api/roles/listar` | Lista roles |
| GET | `/api/roles/buscar/<id_rol>` | Busca rol |
| PUT | `/api/roles/actualizar/<id_rol>` | Actualiza rol |
| DELETE | `/api/roles/inhabilitar/<id_rol>` | Inhabilita rol |

Crear rol:

```json
{
  "nombre": "Ciudadano",
  "descripcion": "Usuario general de la aplicacion"
}
```

Actualizar rol:

```json
{
  "nombre": "Administrador",
  "descripcion": "Gestiona todo el sistema",
  "id_estado": 1
}
```

## Tipo documento

Blueprint: `tipo_documento_bp` con `url_prefix="/api/tipo-documento"`.

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| POST | `/api/tipo-documento/registrar` | Registra tipo de documento |
| GET | `/api/tipo-documento/listar` | Lista tipos de documento |
| GET | `/api/tipo-documento/buscar/<id_tipo_documento>` | Busca tipo de documento |
| PUT | `/api/tipo-documento/actualizar/<id_tipo_documento>` | Actualiza tipo de documento |
| DELETE | `/api/tipo-documento/inhabilitar/<id_tipo_documento>` | Inhabilita tipo de documento |

Crear:

```json
{
  "descripcion": "Cedula de ciudadania"
}
```

Actualizar:

```json
{
  "descripcion": "Tarjeta de identidad",
  "id_estado": 1
}
```

## Materiales

Blueprint sin `url_prefix`.

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| POST | `/materiales` | Crea material |
| GET | `/materiales` | Lista materiales |
| GET | `/materiales/<id_material>` | Busca material |
| PUT | `/materiales/<id_material>` | Edita material |
| PUT | `/materiales/<id_material>/estado` | Cambia estado |

Crear/editar:

```json
{
  "nombre": "Botellas PET",
  "descripcion": "Botellas plasticas reciclables",
  "unidad": "kg",
  "puntos_por_kg": 10,
  "id_tipo_residuo": 1
}
```

Cambiar estado:

```json
{
  "id_estado": 2
}
```

Nota tecnica: `puntos_por_kg` se valida en backend para evitar valores negativos o no numericos.

## Tipos de residuo

Blueprint sin `url_prefix`.

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| POST | `/tipos-residuo` | Crea tipo de residuo |
| GET | `/tipos-residuo` | Lista tipos de residuo |
| GET | `/tipos-residuo/<id_tipo_residuo>` | Busca tipo de residuo |
| PUT | `/tipos-residuo/<id_tipo_residuo>` | Edita tipo de residuo |
| PUT | `/tipos-residuo/<id_tipo_residuo>/estado` | Cambia estado |

Crear/editar:

```json
{
  "nombre": "Plastico",
  "descripcion": "Botellas, bolsas y empaques reciclables",
  "color_contenedor": "Azul"
}
```

## Reciclaje

Blueprint sin `url_prefix`.

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| POST | `/reciclaje` | Crea registro de reciclaje |
| GET | `/reciclaje` | Lista registros |
| GET | `/reciclaje/<id_registro>` | Busca registro |
| PUT | `/reciclaje/<id_registro>/estado` | Cambia estado |

Crear:

```json
{
  "cantidad": 2.5,
  "observaciones": "Entrega de botellas PET",
  "id_usuario": 1,
  "id_tipo_material": 1,
  "id_punto": 1
}
```

## Ubicaciones / puntos de reciclaje

Blueprint sin `url_prefix`.

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| POST | `/ubicaciones` | Crea punto de reciclaje |
| GET | `/ubicaciones` | Lista puntos |

Crear:

```json
{
  "nombre": "Punto Verde Centro",
  "direccion": "Cra. 14 #22-85",
  "horario": "Lunes a viernes 8:00 AM - 5:30 PM"
}
```

## Novedades

Blueprint sin `url_prefix`.

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| POST | `/novedades` | Crea novedad |
| GET | `/novedades` | Lista novedades |
| GET | `/novedades/<id_novedad>` | Busca novedad |
| PUT | `/novedades/<id_novedad>/estado` | Cambia estado |

Crear:

```json
{
  "titulo": "Jornada de reciclaje",
  "descripcion": "Este sabado habra jornada de reciclaje.",
  "imagen": "jornada.jpg",
  "id_usuario": 1
}
```

## Contenido educativo

Blueprint sin `url_prefix`.

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| POST | `/contenido` | Crea contenido educativo |
| GET | `/contenido` | Lista contenido |

Crear:

```json
{
  "titulo": "Como separar residuos",
  "descripcion": "Aprende a separar residuos reciclables desde casa.",
  "tipo": "articulo",
  "url_recurso": "https://ejemplo.com/reciclaje",
  "imagen": "reciclaje.jpg",
  "id_usuario": 1
}
```

## FAQ

Blueprint sin `url_prefix`.

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| POST | `/faq` | Crea pregunta frecuente |
| GET | `/faq` | Lista preguntas frecuentes |

Crear:

```json
{
  "pregunta": "Como creo una cuenta en GreenUp?",
  "respuesta": "Debes registrarte con tu correo y datos personales.",
  "categoria": "Cuenta",
  "orden": 1
}
```

## Estadisticas

Blueprint sin `url_prefix`.

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| GET | `/estadisticas` | Devuelve totales de reciclajes y cantidad reciclada |

Respuesta esperada:

```json
{
  "total_reciclajes": 2,
  "total_cantidad": 3.5
}
```

## Reportes

Blueprint sin `url_prefix`.

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| GET | `/reportes/reciclaje` | Lista informacion consolidada para reporte de reciclaje |

## Respuestas de error comunes

| Estado | Uso comun |
| --- | --- |
| `400` | Faltan datos obligatorios o formato invalido |
| `401` | No hay sesion o credenciales incorrectas |
| `403` | Usuario sin permisos o inactivo |
| `404` | Recurso no encontrado |
| `500` | Error no controlado |
