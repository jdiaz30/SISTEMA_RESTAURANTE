-- Script para limpiar toda la data de prueba
-- ADVERTENCIA: Esto eliminará TODOS los datos excepto la estructura y configuración básica
-- Fecha: 2025-01-15

BEGIN;

-- Eliminar datos de transacciones (de más reciente a más antiguo por dependencias)
DELETE FROM factura_pagos;
DELETE FROM facturas;
DELETE FROM pedido_items;
DELETE FROM pedidos;
DELETE FROM reservas;

-- Restablecer secuencias de IDs
ALTER SEQUENCE factura_pagos_id_seq RESTART WITH 1;
ALTER SEQUENCE facturas_id_seq RESTART WITH 1;
ALTER SEQUENCE pedido_items_id_seq RESTART WITH 1;
ALTER SEQUENCE pedidos_id_seq RESTART WITH 1;
ALTER SEQUENCE reservas_id_seq RESTART WITH 1;

-- Liberar todas las mesas
UPDATE mesas SET estado = 'libre';

-- Mantener productos y categorías (puedes descomentar estas líneas si también quieres eliminarlos)
-- DELETE FROM productos;
-- ALTER SEQUENCE productos_id_seq RESTART WITH 1;

-- Mantener usuarios (administrador), mesas, áreas y categorías
-- Si quieres eliminar productos también, descomenta:
-- DELETE FROM productos;
-- ALTER SEQUENCE productos_id_seq RESTART WITH 1;

COMMIT;

-- Verificar resultado
SELECT 'Pedidos: ' || COUNT(*) as resultado FROM pedidos
UNION ALL
SELECT 'Facturas: ' || COUNT(*) FROM facturas
UNION ALL
SELECT 'Reservas: ' || COUNT(*) FROM reservas
UNION ALL
SELECT 'Mesas libres: ' || COUNT(*) FROM mesas WHERE estado = 'libre'
UNION ALL
SELECT 'Productos: ' || COUNT(*) FROM productos
UNION ALL
SELECT 'Usuarios: ' || COUNT(*) FROM usuarios;

SELECT 'Base de datos limpiada exitosamente' as mensaje;
