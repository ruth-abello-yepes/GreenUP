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
INSERT INTO materiales (
        id_material,
        nombre,
        descripcion,
        unidad,
        puntos_por_kg,
        id_tipo_residuo
    )
VALUES