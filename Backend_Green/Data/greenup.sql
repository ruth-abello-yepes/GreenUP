-- 1. TABLA: estado
CREATE TABLE estado (
    id_estado SERIAL PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL
);
-- 2. TABLA: tipo_documento
CREATE TABLE tipo_documento (
    id_tipo_documento SERIAL PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL,
    id_estado INT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_estado) REFERENCES estado(id_estado)
);
-- 3. TABLA: roles
CREATE TABLE roles (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(150),
    id_estado INT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_estado) REFERENCES estado(id_estado)
);
-- 4. TABLA: usuarios
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    numero_documento VARCHAR(20) NOT NULL UNIQUE,
    celular VARCHAR(15),
    foto_perfil VARCHAR(255),
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_tipo_documento INT NOT NULL,
    id_rol INT NOT NULL,
    id_estado INT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_tipo_documento) REFERENCES tipo_documento(id_tipo_documento),
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol),
    FOREIGN KEY (id_estado) REFERENCES estado(id_estado)
);
-- 5. TABLA: tipo_residuo
CREATE TABLE tipo_residuo (
    id_tipo_residuo SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    color_contenedor VARCHAR(30),
    id_estado INT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_estado) REFERENCES estado(id_estado)
);
-- 6. TABLA: tipo_material
CREATE TABLE tipo_material (
    id_tipo_material SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    unidad VARCHAR(20) NOT NULL DEFAULT 'kg',
    puntos_por_kg INT NOT NULL DEFAULT 0,
    id_tipo_residuo INT,
    id_estado INT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_tipo_residuo) REFERENCES tipo_residuo(id_tipo_residuo),
    FOREIGN KEY (id_estado) REFERENCES estado(id_estado)
);
-- 7. TABLA: puntos_reciclaje
CREATE TABLE puntos_reciclaje (
    id_punto SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    direccion VARCHAR(200) NOT NULL,
    horario VARCHAR(100),
    latitud DECIMAL(10, 7),
    longitud DECIMAL(10, 7),
    telefono VARCHAR(15),
    responsable VARCHAR(100),
    id_estado INT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_estado) REFERENCES estado(id_estado)
);
-- 8. TABLA: punto_material
CREATE TABLE punto_material (
    id_punto_material SERIAL PRIMARY KEY,
    id_punto INT NOT NULL,
    id_tipo_material INT NOT NULL,
    FOREIGN KEY (id_punto) REFERENCES puntos_reciclaje(id_punto),
    FOREIGN KEY (id_tipo_material) REFERENCES tipo_material(id_tipo_material),
    UNIQUE (id_punto, id_tipo_material)
);
-- 9. TABLA: registrar_reciclaje
CREATE TABLE registrar_reciclaje (
    id_registro SERIAL PRIMARY KEY,
    cantidad DECIMAL(10, 2) NOT NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    puntos_obtenidos INT NOT NULL DEFAULT 0,
    observaciones TEXT,
    id_usuario INT NOT NULL,
    id_tipo_material INT NOT NULL,
    id_punto INT,
    id_estado INT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_tipo_material) REFERENCES tipo_material(id_tipo_material),
    FOREIGN KEY (id_punto) REFERENCES puntos_reciclaje(id_punto),
    FOREIGN KEY (id_estado) REFERENCES estado(id_estado)
);
-- 10. TABLA: contenido_educativo
CREATE TABLE contenido_educativo (
    id_contenido SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) NOT NULL,
    url_recurso VARCHAR(500),
    imagen VARCHAR(255),
    fecha_publicacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT NOT NULL,
    id_estado INT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_estado) REFERENCES estado(id_estado)
);
-- 11. TABLA: novedades
CREATE TABLE novedades (
    id_novedad SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    imagen VARCHAR(255),
    fecha_publicacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT NOT NULL,
    id_estado INT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_estado) REFERENCES estado(id_estado)
);
-- 12. TABLA: preguntas_frecuentes
CREATE TABLE preguntas_frecuentes (
    id_pregunta SERIAL PRIMARY KEY,
    pregunta TEXT NOT NULL,
    respuesta TEXT NOT NULL,
    categoria VARCHAR(100),
    orden INT NOT NULL DEFAULT 0,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_estado INT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_estado) REFERENCES estado(id_estado)
);
-- 13. TABLA: recicladoras
CREATE TABLE recicladoras (
    id_recicladora SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    nit_empresa VARCHAR(30) NOT NULL UNIQUE,
    nombre_empresa VARCHAR(150) NOT NULL,
    direccion_empresa VARCHAR(200) NOT NULL,
    telefono_empresa VARCHAR(20),
    camara_comercio VARCHAR(255),
    id_estado INT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_estado) REFERENCES estado(id_estado)
);
-- INSERCIÓN DE DATOS INICIALES
INSERT INTO estado (descripcion)
VALUES ('Activo'),
    ('Inactivo');
INSERT INTO roles (nombre, descripcion, id_estado)
VALUES ('Administrador', 'Gestiona todo el sistema', 1),
    ('Reciclador', 'Gestiona puntos de reciclaje', 1),
    ('Ciudadano', 'Usuario general', 1);
INSERT INTO tipo_documento (descripcion, id_estado)
VALUES ('Cedula de ciudadania', 1),
    ('Tarjeta de identidad', 1),
    ('Cedula de extranjeria', 1);