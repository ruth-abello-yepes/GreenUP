USE greenup;

INSERT INTO estado (descripcion) VALUES
('Activo'),
('Inactivo');

INSERT INTO roles (nombre, descripcion, id_estado) VALUES
('Administrador', 'Gestiona todo el sistema', 1),
('Reciclador', 'Gestiona puntos de reciclaje', 1),
('Ciudadano', 'Usuario general', 1);

INSERT INTO tipo_documento (descripcion, id_estado) VALUES
('Cedula de ciudadania', 1),
('Tarjeta de identidad', 1),
('Cedula de extranjeria', 1);

INSERT INTO usuario (nombre, apellido, email, password, id_tipo_documento, numero_documento, id_rol, id_estado) VALUES
('Juan', 'Perez', 'juan.perez@example.com', 'password123', 1, '123456789', 3, 1); 

INSERT INTO punto_reciclaje (nombre, direccion, id_estado) VALUES
('Punto Reciclaje Centro', 'Calle 123 #45-67', 1),
('Punto Reciclaje Norte', 'Avenida 456 #78-90', 1);

INSERT INTO tipo_residuo (descripcion, id_estado) VALUES
('Plástico', 1),
('Papel', 1),
('Vidrio', 1);

INSERT INTO reciclaje (id_usuario, id_punto_reciclaje, id_tipo_residuo, cantidad, fecha_reciclaje) VALUES
(1, 1, 1, 5.0, '2024-06-01'),
(1, 2, 2, 3.0, '2024-06-02');

INSERT INTO recompensa (descripcion, puntos_recompensa, id_estado) VALUES
('Descuento en tienda', 100, 1),
('Entrada a evento', 200, 1);

INSERT INTO canje (id_usuario, id_recompensa, fecha_canje) VALUES
(1, 1, '2024-06-10');


