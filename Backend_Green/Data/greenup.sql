CREATE DATABASE IF NOT EXISTS greenup CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE greenup;
-- 1. TABLA: estado
--    Controla si un registro está activo o inactivo en el sistema.
CREATE TABLE estado (
    id_estado INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL
);
-- 2. TABLA: tipo_documento
--    Tipos de documento de identidad (CC, TI, CE, Pasaporte, etc.)
CREATE TABLE tipo_documento (
    id_tipo_documento INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL,
    id_estado INT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_estado) REFERENCES estado(id_estado)
);
-- 3. TABLA: roles
--    Roles del sistema (Administrador, Usuario, Moderador, etc.)
CREATE TABLE roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(150),
    id_estado INT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_estado) REFERENCES estado(id_estado)
);
-- 4. TABLA: usuarios
--    Almacena los usuarios registrados en la aplicación.
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    -- Siempre guardar hash (bcrypt)
    numero_documento VARCHAR(20) NOT NULL UNIQUE,
    -- VARCHAR: CC puede tener hasta 10 dígitos, CE y pasaporte tienen letras
    celular VARCHAR(15),
    -- VARCHAR: formato +573001234567 o 3001234567
    foto_perfil VARCHAR(255),
    -- Ruta relativa de la imagen de perfil
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_tipo_documento INT NOT NULL,
    id_rol INT NOT NULL,
    id_estado INT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_tipo_documento) REFERENCES tipo_documento(id_tipo_documento),
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol),
    FOREIGN KEY (id_estado) REFERENCES estado(id_estado)
);
-- 5. TABLA: tipo_residuo
--    Clasificación general del residuo (Orgánico, Inorgánico,
--    Peligroso, Especial, etc.)
CREATE TABLE tipo_residuo (
    id_tipo_residuo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    color_contenedor VARCHAR(30),
    -- Color del contenedor asociado (ej: azul, verde, rojo)
    id_estado INT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_estado) REFERENCES estado(id_estado)
);
-- 6. TABLA: tipo_material
--    Materiales reciclables específicos (Papel, Cartón, Vidrio,
--    Plástico PET, Aluminio, etc.)
CREATE TABLE tipo_material (
    id_tipo_material INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    unidad VARCHAR(20) NOT NULL DEFAULT 'kg',
    -- kg, g, unidad, litros
    puntos_por_kg INT NOT NULL DEFAULT 0,
    -- Puntos que gana el usuario por kg reciclado
    id_tipo_residuo INT,
    -- Relación con la clasificación de residuo
    id_estado INT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_tipo_residuo) REFERENCES tipo_residuo(id_tipo_residuo),
    FOREIGN KEY (id_estado) REFERENCES estado(id_estado)
);
-- 7. TABLA: puntos_reciclaje
--    Ubicaciones físicas donde se puede reciclar en Valledupar.
--    (Antes llamada 'ubicacion', se amplía con coordenadas GPS
--    y nombre del punto para soportar la geolocalización.)
CREATE TABLE puntos_reciclaje (
    id_punto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    -- Nombre del punto (ej: "Punto Verde Centro")
    direccion VARCHAR(200) NOT NULL,
    horario VARCHAR(100),
    latitud DECIMAL(10, 7),
    -- Coordenada GPS: latitud  (ej: 10.4756000)
    longitud DECIMAL(10, 7),
    -- Coordenada GPS: longitud (ej: -73.2500000)
    telefono VARCHAR(15),
    responsable VARCHAR(100),
    -- Persona o entidad responsable del punto
    id_estado INT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_estado) REFERENCES estado(id_estado)
);
-- 8. TABLA: punto_material (Relación N:M)
--    Un punto de reciclaje acepta varios materiales y un
--    material puede estar en varios puntos.
CREATE TABLE punto_material (
    id_punto_material INT AUTO_INCREMENT PRIMARY KEY,
    id_punto INT NOT NULL,
    id_tipo_material INT NOT NULL,
    FOREIGN KEY (id_punto) REFERENCES puntos_reciclaje(id_punto),
    FOREIGN KEY (id_tipo_material) REFERENCES tipo_material(id_tipo_material),
    UNIQUE KEY uq_punto_material (id_punto, id_tipo_material) -- Evita duplicados
);
-- 9. TABLA: registrar_reciclaje
--    Registro de cada actividad de reciclaje realizada por
--    un usuario en un punto específico.
CREATE TABLE registrar_reciclaje (
    id_registro INT AUTO_INCREMENT PRIMARY KEY,
    cantidad DECIMAL(10, 2) NOT NULL,
    -- Cantidad reciclada en la unidad del material
    fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    puntos_obtenidos INT NOT NULL DEFAULT 0,
    -- Puntos ganados en este registro
    observaciones TEXT,
    id_usuario INT NOT NULL,
    id_tipo_material INT NOT NULL,
    id_punto INT,
    -- Puede ser NULL si es registro offline sin ubicación
    id_estado INT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_tipo_material) REFERENCES tipo_material(id_tipo_material),
    FOREIGN KEY (id_punto) REFERENCES puntos_reciclaje(id_punto),
    FOREIGN KEY (id_estado) REFERENCES estado(id_estado)
);
-- 10. TABLA: contenido_educativo
--     Artículos, videos y recursos educativos sobre
--     reciclaje y medio ambiente.
CREATE TABLE contenido_educativo (
    id_contenido INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) NOT NULL,
    -- 'articulo', 'video', 'infografia', 'tip'
    url_recurso VARCHAR(500),
    -- Enlace externo o ruta interna del archivo
    imagen VARCHAR(255),
    -- Ruta de imagen de portada
    fecha_publicacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT NOT NULL,
    -- Quién publicó el contenido (admin)
    id_estado INT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_estado) REFERENCES estado(id_estado)
);
-- 11. TABLA: novedades
--     Noticias, anuncios y alertas publicadas en la app.
CREATE TABLE novedades (
    id_novedad INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    imagen VARCHAR(255),
    -- Ruta de imagen asociada a la novedad
    fecha_publicacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT NOT NULL,
    -- Admin que publica la novedad
    id_estado INT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_estado) REFERENCES estado(id_estado)
);
-- 12. TABLA: preguntas_frecuentes
--     Preguntas y respuestas del FAQ de la aplicación.
CREATE TABLE preguntas_frecuentes (
    id_pregunta INT AUTO_INCREMENT PRIMARY KEY,
    pregunta TEXT NOT NULL,
    respuesta TEXT NOT NULL,
    categoria VARCHAR(100),
    -- Ej: "Reciclaje", "Cuenta", "Puntos"
    orden INT NOT NULL DEFAULT 0,
    -- Para controlar el orden de visualización
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Se actualiza automáticamente
    id_estado INT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_estado) REFERENCES estado(id_estado)
);
USE greenup;
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
INSERT INTO tipo_residuo (nombre, descripcion, color_contenedor, id_estado)
VALUES (
        'Plástico',
        'Botellas, bolsas y empaques plásticos reciclables',
        'Azul',
        1
    ),
    (
        'Vidrio',
        'Botellas y frascos de vidrio reciclables',
        'Verde',
        1
    ),
    (
        'Papel y cartón',
        'Papel, cajas y empaques de cartón reciclables',
        'Gris',
        1
    ),
    (
        'Metal',
        'Latas y elementos metálicos reciclables',
        'Amarillo',
        1
    );
-- MATERIALES RECICLABLES
INSERT INTO tipo_material (
        nombre,
        descripcion,
        unidad,
        puntos_por_kg,
        id_tipo_residuo,
        id_estado
    )
VALUES (
        'Botellas PET',
        'Botellas plásticas reciclables',
        'kg',
        10,
        1,
        1
    ),
    (
        'Bolsas plásticas',
        'Bolsas limpias y secas',
        'kg',
        6,
        1,
        1
    ),
    (
        'Botellas de vidrio',
        'Botellas de vidrio reciclables',
        'kg',
        12,
        2,
        1
    ),
    (
        'Cartón',
        'Cajas y empaques de cartón',
        'kg',
        8,
        3,
        1
    ),
    (
        'Latas de aluminio',
        'Latas de bebidas reciclables',
        'kg',
        15,
        4,
        1
    );
-- PUNTOS DE RECICLAJE
INSERT INTO puntos_reciclaje (
        nombre,
        direccion,
        horario,
        telefono,
        responsable,
        id_estado
    )
VALUES (
        'Recicladora Valledupar RECICLA',
        'Cra. 14 #22-85, Valledupar',
        'Lunes a viernes 8:00 AM - 5:30 PM',
        '3054690787',
        'RECICLA',
        1
    ),
    (
        'COORECIPROS LA 55',
        '200001 Valledupar',
        'Lunes a sábado 7:00 AM - 5:30 PM',
        '3135092121',
        'COORECIPROS',
        1
    ),
    (
        'Coorrenacer',
        'Carrera 15 #22-40, Valledupar',
        'Lunes a viernes 8:00 AM - 6:00 PM',
        '55700564',
        'Coorrenacer',
        1
    );
-- REGISTRAR RECICLAJE
-- Necesita que exista un usuario con id_usuario = 1.
INSERT INTO registrar_reciclaje (
        cantidad,
        puntos_obtenidos,
        observaciones,
        id_usuario,
        id_tipo_material,
        id_punto,
        id_estado
    )
VALUES (2.50, 25, 'Entrega de botellas PET', 1, 1, 1, 1),
    (1.00, 8, 'Entrega de cartón', 1, 4, 2, 1);
-- NOVEDADES
-- Necesita que exista un usuario con id_usuario = 1.
INSERT INTO novedades (
        titulo,
        descripcion,
        imagen,
        id_usuario,
        id_estado
    )
VALUES (
        'Jornada de reciclaje',
        'Este sábado habrá jornada de reciclaje en Valledupar.',
        'jornada.jpg',
        1,
        1
    );
-- CONTENIDO EDUCATIVO
-- Necesita que exista un usuario con id_usuario = 1.
INSERT INTO contenido_educativo (
        titulo,
        descripcion,
        tipo,
        url_recurso,
        imagen,
        id_usuario,
        id_estado
    )
VALUES (
        'Cómo separar residuos',
        'Aprende a separar residuos reciclables desde casa.',
        'articulo',
        'https://ejemplo.com/reciclaje',
        'reciclaje.jpg',
        1,
        1
    );
-- PREGUNTAS FRECUENTES
INSERT INTO preguntas_frecuentes (pregunta, respuesta, categoria, orden, id_estado)
VALUES (
        '¿Cómo creo una cuenta en GreenUp?',
        'Debes registrarte usando tu correo electrónico y completar tus datos personales.',
        'Cuenta',
        1,
        1
    ),
    (
        '¿Cómo encuentro los puntos de reciclaje más cercanos?',
        'Activa tu ubicación y podrás ver los puntos de reciclaje cercanos.',
        'Reciclaje',
        2,
        1
    ),
    (
        '¿Qué tipos de residuos puedo reportar?',
        'Puedes reportar plástico, vidrio, cartón y residuos reciclables.',
        'Reciclaje',
        3,
        1
    ),
    (
        '¿Cómo edito mis datos personales?',
        'Desde el menú perfil puedes actualizar tus datos personales.',
        'Cuenta',
        4,
        1
    ),
    (
        '¿Qué sucede si olvido mi contraseña?',
        'Puedes recuperar tu contraseña usando tu correo registrado.',
        'Cuenta',
        5,
        1
    ),
    (
        '¿Cómo accedo al contenido educativo?',
        'En la sección educativa encontrarás artículos y videos sobre reciclaje.',
        'Educación',
        6,
        1
    ),
    (
        '¿Por qué no aparecen puntos de reciclaje cerca de mí?',
        'Asegúrate de activar la ubicación de tu dispositivo.',
        'Ubicación',
        7,
        1
    );