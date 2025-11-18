-- ============================================
-- DATOS DE PRUEBA - RESTAURANTE CARY
-- Version compatible con Windows
-- ============================================

\c cary_restaurant;

-- Limpiar datos existentes
TRUNCATE TABLE facturas, pedido_items, pedidos, reservas, mesas, areas, productos, categorias, usuarios RESTART IDENTITY CASCADE;

-- ============================================
-- USUARIOS (Contrasena: "123456" para todos)
-- ============================================
INSERT INTO usuarios (nombre, email, password, rol) VALUES
('Fausto Tavarez', 'admin@cary.com', '$2a$10$rKvH8YhZ8YhZ8YhZ8YhZ8eO1qH8YhZ8YhZ8YhZ8YhZ8YhZ8YhZ8', 'admin'),
('Carmen Rodriguez', 'carmen@cary.com', '$2a$10$rKvH8YhZ8YhZ8YhZ8YhZ8eO1qH8YhZ8YhZ8YhZ8YhZ8YhZ8YhZ8', 'mesero'),
('Juan Perez', 'juan@cary.com', '$2a$10$rKvH8YhZ8YhZ8YhZ8YhZ8eO1qH8YhZ8YhZ8YhZ8YhZ8YhZ8YhZ8', 'cajero'),
('Maria Gonzalez', 'maria@cary.com', '$2a$10$rKvH8YhZ8YhZ8YhZ8YhZ8eO1qH8YhZ8YhZ8YhZ8YhZ8YhZ8YhZ8', 'mesero');

-- ============================================
-- AREAS DEL RESTAURANTE
-- ============================================
INSERT INTO areas (nombre, descripcion) VALUES
('Salon Principal', 'Area principal del restaurante con ambiente familiar'),
('Terraza', 'Area al aire libre con vista panoramica'),
('VIP', 'Area exclusiva con ambiente privado y musica en vivo');

-- ============================================
-- MESAS
-- ============================================
INSERT INTO mesas (numero, capacidad, area_id, estado) VALUES
-- Salon Principal (10 mesas)
(1, 4, 1, 'libre'),
(2, 4, 1, 'libre'),
(3, 2, 1, 'ocupada'),
(4, 6, 1, 'libre'),
(5, 4, 1, 'reservada'),
(6, 2, 1, 'libre'),
(7, 8, 1, 'libre'),
(8, 4, 1, 'ocupada'),
(9, 6, 1, 'libre'),
(10, 4, 1, 'libre'),
-- Terraza (8 mesas)
(11, 2, 2, 'libre'),
(12, 4, 2, 'libre'),
(13, 4, 2, 'reservada'),
(14, 6, 2, 'libre'),
(15, 2, 2, 'libre'),
(16, 4, 2, 'libre'),
(17, 8, 2, 'libre'),
(18, 4, 2, 'libre'),
-- VIP (4 mesas)
(19, 4, 3, 'libre'),
(20, 6, 3, 'libre'),
(21, 8, 3, 'reservada'),
(22, 4, 3, 'libre');

-- ============================================
-- CATEGORIAS DE PRODUCTOS
-- ============================================
INSERT INTO categorias (nombre, descripcion, orden) VALUES
('Entradas', 'Aperitivos y entradas para comenzar', 1),
('Platos Fuertes', 'Platos principales de carne, pollo y pescado', 2),
('Pastas', 'Variedad de pastas italianas', 3),
('Ensaladas', 'Ensaladas frescas y saludables', 4),
('Bebidas', 'Bebidas frias y calientes', 5),
('Postres', 'Dulces y postres caseros', 6);

-- ============================================
-- PRODUCTOS DEL MENU
-- ============================================
INSERT INTO productos (nombre, descripcion, precio, categoria_id, disponible) VALUES
-- Entradas
('Alitas BBQ', '8 alitas de pollo con salsa BBQ', 450.00, 1, TRUE),
('Deditos de Queso', '6 deditos de mozzarella empanizados', 380.00, 1, TRUE),
('Nachos Supreme', 'Nachos con queso, guacamole y pico de gallo', 520.00, 1, TRUE),
('Yuca Frita', 'Yuca frita con salsa de ajo', 280.00, 1, TRUE),
-- Platos Fuertes
('Churrasco Premium', 'Carne de res 300g con papas y ensalada', 850.00, 2, TRUE),
('Pechuga a la Plancha', 'Pechuga de pollo con vegetales', 620.00, 2, TRUE),
('Costillas BBQ', 'Costillas de cerdo en salsa BBQ', 780.00, 2, TRUE),
('Filete de Pescado', 'Pescado fresco del dia con arroz', 720.00, 2, TRUE),
('Pollo al Horno', 'Medio pollo con tostones', 650.00, 2, TRUE),
-- Pastas
('Pasta Alfredo', 'Fettuccine en salsa Alfredo con pollo', 580.00, 3, TRUE),
('Espagueti Bolonesa', 'Espagueti con salsa de carne', 550.00, 3, TRUE),
('Lasagna Clasica', 'Lasagna de carne y queso', 620.00, 3, TRUE),
('Pasta Carbonara', 'Pasta con tocino y salsa cremosa', 590.00, 3, TRUE),
-- Ensaladas
('Ensalada Cesar', 'Lechuga romana, crutones, parmesano', 420.00, 4, TRUE),
('Ensalada Cary', 'Mix de vegetales con aderezo de la casa', 380.00, 4, TRUE),
('Ensalada Griega', 'Tomate, pepino, queso feta, aceitunas', 450.00, 4, TRUE),
-- Bebidas
('Coca Cola', 'Refresco 500ml', 120.00, 5, TRUE),
('Sprite', 'Refresco 500ml', 120.00, 5, TRUE),
('Jugo de Naranja Natural', 'Jugo recien exprimido', 180.00, 5, TRUE),
('Limonada Natural', 'Limonada fresca', 150.00, 5, TRUE),
('Cerveza Nacional', 'Cerveza fria 355ml', 200.00, 5, TRUE),
('Cerveza Importada', 'Cerveza premium 355ml', 280.00, 5, TRUE),
('Cafe Americano', 'Cafe negro', 100.00, 5, TRUE),
('Cappuccino', 'Cafe con leche espumosa', 150.00, 5, TRUE),
-- Postres
('Tres Leches', 'Bizcocho empapado en tres leches', 280.00, 6, TRUE),
('Flan de Caramelo', 'Flan casero con caramelo', 250.00, 6, TRUE),
('Helado', 'Tres bolas de helado a eleccion', 220.00, 6, TRUE),
('Brownie con Helado', 'Brownie caliente con helado de vainilla', 320.00, 6, TRUE);

-- ============================================
-- RESERVACIONES
-- ============================================
INSERT INTO reservas (cliente_nombre, cliente_telefono, cliente_email, fecha, hora, num_personas, mesa_id, estado, notas) VALUES
('Juan Perez', '809-555-1234', 'juan.perez@email.com', CURRENT_DATE, '19:00:00', 4, 5, 'confirmada', 'Celebracion de cumpleanos'),
('Maria Lopez', '809-555-5678', 'maria.lopez@email.com', CURRENT_DATE, '20:30:00', 6, 13, 'confirmada', 'Preferencia en terraza'),
('Carlos Martinez', '809-555-9012', 'carlos.m@email.com', CURRENT_DATE + 1, '18:00:00', 8, 21, 'pendiente', 'Cena empresarial'),
('Ana Rodriguez', '809-555-3456', 'ana.r@email.com', CURRENT_DATE + 1, '19:30:00', 2, NULL, 'pendiente', 'Cena romantica'),
('Pedro Sanchez', '809-555-7890', 'pedro.s@email.com', CURRENT_DATE + 2, '20:00:00', 4, NULL, 'pendiente', NULL);

-- ============================================
-- PEDIDOS ACTUALES (Para demo)
-- ============================================
INSERT INTO pedidos (mesa_id, usuario_id, estado, subtotal, impuesto, total) VALUES
(3, 2, 'entregado', 1520.00, 273.60, 1793.60),
(8, 3, 'preparando', 2180.00, 392.40, 2572.40);

-- Items del Pedido Mesa 3
INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario, posicion, notas) VALUES
(1, 1, 1, 450.00, 1, NULL),  -- Alitas BBQ
(1, 6, 1, 620.00, 1, NULL),  -- Pechuga
(1, 18, 1, 120.00, 1, NULL), -- Coca Cola
(1, 7, 1, 780.00, 2, 'Termino 3/4'), -- Costillas
(1, 21, 1, 200.00, 2, NULL); -- Cerveza

-- Items del Pedido Mesa 8
INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario, posicion, notas) VALUES
(2, 5, 1, 850.00, 1, 'Sin cebolla'),     -- Churrasco
(2, 10, 1, 580.00, 1, NULL),            -- Pasta Alfredo
(2, 14, 1, 420.00, 1, NULL),            -- Ensalada Cesar
(2, 22, 2, 280.00, 1, NULL),            -- Cerveza Importada x2
(2, 26, 1, 280.00, 2, NULL);            -- Tres Leches

-- ============================================
-- FACTURAS (Historial)
-- ============================================
INSERT INTO facturas (numero_factura, pedido_id, mesa_id, cliente_nombre, fecha_hora, subtotal, impuesto, total, metodo_pago, usuario_id) VALUES
('F-001-2025', NULL, 1, 'Cliente Walk-in', CURRENT_DATE - 2, 1450.00, 261.00, 1711.00, 'efectivo', 4),
('F-002-2025', NULL, 4, 'Laura Fernandez', CURRENT_DATE - 2, 2380.00, 428.40, 2808.40, 'tarjeta', 4),
('F-003-2025', NULL, 7, 'Roberto Diaz', CURRENT_DATE - 1, 3250.00, 585.00, 3835.00, 'tarjeta', 4),
('F-004-2025', NULL, 12, 'Sofia Ramirez', CURRENT_DATE - 1, 1820.00, 327.60, 2147.60, 'efectivo', 4),
('F-005-2025', NULL, 19, 'Miguel Angel', CURRENT_DATE, 4150.00, 747.00, 4897.00, 'transferencia', 4);

-- ============================================
-- VERIFICACION DE DATOS
-- ============================================
SELECT 'Usuarios: ' || COUNT(*) as resultado FROM usuarios;
SELECT 'Areas: ' || COUNT(*) as resultado FROM areas;
SELECT 'Mesas: ' || COUNT(*) as resultado FROM mesas;
SELECT 'Categorias: ' || COUNT(*) as resultado FROM categorias;
SELECT 'Productos: ' || COUNT(*) as resultado FROM productos;
SELECT 'Reservas: ' || COUNT(*) as resultado FROM reservas;
SELECT 'Pedidos: ' || COUNT(*) as resultado FROM pedidos;
SELECT 'Facturas: ' || COUNT(*) as resultado FROM facturas;

-- Estado actual de mesas
SELECT estado, COUNT(*) as cantidad FROM mesas GROUP BY estado ORDER BY estado;

-- Productos por categoria
SELECT c.nombre, COUNT(p.id) as productos
FROM categorias c
LEFT JOIN productos p ON c.id = p.categoria_id
GROUP BY c.id, c.nombre
ORDER BY c.orden;

SELECT 'Base de datos lista!' as status;
