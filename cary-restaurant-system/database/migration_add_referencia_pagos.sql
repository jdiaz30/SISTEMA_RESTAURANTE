-- Migración: Agregar campo de referencia a pagos
-- Fecha: 2025-01-15
-- Descripción: Permite almacenar número de referencia para pagos con tarjeta o transferencia

-- Agregar columna referencia
ALTER TABLE factura_pagos ADD COLUMN IF NOT EXISTS referencia VARCHAR(100);

-- Comentario
COMMENT ON COLUMN factura_pagos.referencia IS 'Número de referencia o autorización para pagos con tarjeta o transferencia';

-- Verificación
SELECT 'Migración completada: campo referencia agregado' as mensaje;
