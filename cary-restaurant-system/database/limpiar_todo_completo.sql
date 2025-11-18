-- Script para limpiar TODO (incluyendo productos, categorías, mesas, áreas)
-- ADVERTENCIA: Esto eliminará ABSOLUTAMENTE TODO excepto usuarios y estructura de tablas
-- Solo mantiene el usuario administrador
-- Fecha: 2025-01-15

BEGIN;

-- 1. Eliminar transacciones
DELETE FROM factura_pagos;
DELETE FROM facturas;
DELETE FROM pedido_items;
DELETE FROM pedidos;
DELETE FROM reservas;

-- 2. Eliminar productos y categorías
DELETE FROM productos;
DELETE FROM categorias;

-- 3. Eliminar mesas y áreas
DELETE FROM mesas;
DELETE FROM areas;

-- 4. Restablecer TODAS las secuencias
ALTER SEQUENCE factura_pagos_id_seq RESTART WITH 1;
ALTER SEQUENCE facturas_id_seq RESTART WITH 1;
ALTER SEQUENCE pedido_items_id_seq RESTART WITH 1;
ALTER SEQUENCE pedidos_id_seq RESTART WITH 1;
ALTER SEQUENCE reservas_id_seq RESTART WITH 1;
ALTER SEQUENCE productos_id_seq RESTART WITH 1;
ALTER SEQUENCE categorias_id_seq RESTART WITH 1;
ALTER SEQUENCE mesas_id_seq RESTART WITH 1;
ALTER SEQUENCE areas_id_seq RESTART WITH 1;

-- Mantener usuarios (solo el admin)
-- Si quieres también limpiar usuarios (excepto uno), descomenta esto:
-- DELETE FROM usuarios WHERE id > 1;
-- ALTER SEQUENCE usuarios_id_seq RESTART WITH 2;

COMMIT;

-- Verificar resultado
SELECT
  'Pedidos: ' || (SELECT COUNT(*) FROM pedidos) ||
  ', Facturas: ' || (SELECT COUNT(*) FROM facturas) ||
  ', Reservas: ' || (SELECT COUNT(*) FROM reservas) ||
  ', Productos: ' || (SELECT COUNT(*) FROM productos) ||
  ', Mesas: ' || (SELECT COUNT(*) FROM mesas) ||
  ', Áreas: ' || (SELECT COUNT(*) FROM areas) ||
  ', Usuarios: ' || (SELECT COUNT(*) FROM usuarios)
  as resultado;

SELECT 'Base de datos COMPLETAMENTE limpiada - Sistema en blanco' as mensaje;
