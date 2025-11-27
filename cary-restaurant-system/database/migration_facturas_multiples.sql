-- Migración: Sistema de Facturas Múltiples para Pagos Divididos
-- Fecha: 2025-11-27
-- Descripción: Permite generar facturas individuales para cada persona en pagos divididos

-- ============================================
-- PASO 1: Agregar campos para vincular facturas relacionadas
-- ============================================

-- Factura principal (para agrupar facturas de un mismo pedido dividido)
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS factura_principal_id INTEGER REFERENCES facturas(id) ON DELETE CASCADE;

-- Orden de división (A, B, C, etc. - se guarda como número: 1, 2, 3)
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS orden_division INTEGER DEFAULT 1;

-- Tipo de factura: 'unica' (una persona paga todo) o 'dividida' (parte de un pago dividido)
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS tipo_factura VARCHAR(20) DEFAULT 'unica' CHECK (tipo_factura IN ('unica', 'dividida'));

-- ============================================
-- PASO 2: Crear tabla de items por factura
-- ============================================

CREATE TABLE IF NOT EXISTS factura_items (
    id SERIAL PRIMARY KEY,
    factura_id INTEGER NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES productos(id) ON DELETE SET NULL,
    producto_nombre VARCHAR(100) NOT NULL, -- Guardamos el nombre por si se elimina el producto
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
    posicion INTEGER, -- Posición/silla de la mesa (opcional)
    notas TEXT,
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_factura_items_factura_id ON factura_items(factura_id);
CREATE INDEX IF NOT EXISTS idx_factura_items_producto_id ON factura_items(producto_id);

-- ============================================
-- PASO 3: Agregar campos adicionales a factura_pagos
-- ============================================

-- Guardar información de productos/posiciones asignadas (como JSON para referencia histórica)
ALTER TABLE factura_pagos ADD COLUMN IF NOT EXISTS productos_asignados JSONB;
ALTER TABLE factura_pagos ADD COLUMN IF NOT EXISTS posiciones_asignadas INTEGER[];

-- ============================================
-- PASO 4: Actualizar el CHECK del método de pago
-- ============================================

-- Primero eliminamos el constraint anterior si existe
DO $$
BEGIN
    -- Eliminar constraint de metodo_pago en facturas
    ALTER TABLE facturas DROP CONSTRAINT IF EXISTS facturas_metodo_pago_check;

    -- Eliminar constraint de metodo_pago en factura_pagos
    ALTER TABLE factura_pagos DROP CONSTRAINT IF EXISTS factura_pagos_metodo_pago_check;
END $$;

-- Agregar los nuevos constraints (ahora 'multiple' es válido)
ALTER TABLE facturas ADD CONSTRAINT facturas_metodo_pago_check
    CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'multiple'));

ALTER TABLE factura_pagos ADD CONSTRAINT factura_pagos_metodo_pago_check
    CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia'));

-- ============================================
-- PASO 5: Crear vista para facturas con sus items
-- ============================================

CREATE OR REPLACE VIEW vista_facturas_completas AS
SELECT
    f.id,
    f.numero_factura,
    f.pedido_id,
    f.mesa_id,
    f.cliente_nombre,
    f.fecha_hora,
    f.subtotal,
    f.impuesto,
    f.total,
    f.metodo_pago,
    f.usuario_id,
    f.pago_dividido,
    f.factura_principal_id,
    f.orden_division,
    f.tipo_factura,
    f.created_at,
    CASE
        WHEN f.factura_principal_id IS NOT NULL THEN f.numero_factura
        WHEN f.tipo_factura = 'dividida' THEN f.numero_factura
        ELSE f.numero_factura
    END as numero_factura_completo,
    COUNT(fi.id) as cantidad_items,
    COUNT(fp.id) as cantidad_pagos
FROM facturas f
LEFT JOIN factura_items fi ON f.id = fi.factura_id
LEFT JOIN factura_pagos fp ON f.id = fp.factura_id
GROUP BY f.id;

-- ============================================
-- PASO 6: Comentarios para documentación
-- ============================================

COMMENT ON COLUMN facturas.factura_principal_id IS 'ID de la factura principal cuando es parte de un pago dividido. NULL para facturas únicas o la primera factura del grupo';
COMMENT ON COLUMN facturas.orden_division IS 'Orden de la factura en un pago dividido (1=A, 2=B, 3=C, etc.)';
COMMENT ON COLUMN facturas.tipo_factura IS 'Tipo: unica (una persona paga todo) o dividida (parte de pago dividido)';
COMMENT ON TABLE factura_items IS 'Items específicos de cada factura (permite facturas con diferentes productos)';
COMMENT ON COLUMN factura_items.producto_nombre IS 'Nombre del producto al momento de la factura (histórico)';
COMMENT ON COLUMN factura_items.posicion IS 'Posición/silla de la mesa que consumió este item';
COMMENT ON COLUMN factura_pagos.productos_asignados IS 'JSON con los IDs de productos asignados a este pago (referencia histórica)';
COMMENT ON COLUMN factura_pagos.posiciones_asignadas IS 'Array de posiciones asignadas a este pago (referencia histórica)';

-- ============================================
-- PASO 7: Migrar datos existentes (opcional)
-- ============================================

-- Las facturas existentes ya son de tipo 'unica' por defecto
-- Si necesitas migrar items existentes a factura_items, ejecuta:

/*
INSERT INTO factura_items (factura_id, producto_id, producto_nombre, cantidad, precio_unitario, posicion)
SELECT
    f.id as factura_id,
    pi.producto_id,
    p.nombre as producto_nombre,
    pi.cantidad,
    pi.precio_unitario,
    pi.posicion
FROM facturas f
INNER JOIN pedidos ped ON f.pedido_id = ped.id
INNER JOIN pedido_items pi ON ped.id = pi.pedido_id
LEFT JOIN productos p ON pi.producto_id = p.id
WHERE f.id NOT IN (SELECT DISTINCT factura_id FROM factura_items);
*/

-- ============================================
-- Verificación
-- ============================================

SELECT 'Migración de facturas múltiples completada exitosamente' as mensaje;
SELECT 'Tablas creadas: factura_items' as info;
SELECT 'Campos agregados a facturas: factura_principal_id, orden_division, tipo_factura' as info;
SELECT 'Vista creada: vista_facturas_completas' as info;
