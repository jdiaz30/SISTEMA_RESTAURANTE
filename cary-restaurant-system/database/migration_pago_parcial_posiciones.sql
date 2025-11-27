-- Migración: Sistema de Pago Parcial por Posiciones
-- Fecha: 2025-11-27
-- Descripción: Permite facturar posiciones individuales sin cerrar toda la mesa

-- ============================================
-- PASO 1: Agregar campo 'facturado' a pedido_items
-- ============================================

ALTER TABLE pedido_items ADD COLUMN IF NOT EXISTS facturado BOOLEAN DEFAULT FALSE;
ALTER TABLE pedido_items ADD COLUMN IF NOT EXISTS factura_id INTEGER REFERENCES facturas(id) ON DELETE SET NULL;
ALTER TABLE pedido_items ADD COLUMN IF NOT EXISTS fecha_facturacion TIMESTAMP;

-- Índice para consultas rápidas de items no facturados
CREATE INDEX IF NOT EXISTS idx_pedido_items_facturado ON pedido_items(pedido_id, facturado);
CREATE INDEX IF NOT EXISTS idx_pedido_items_posicion_facturado ON pedido_items(pedido_id, posicion, facturado);

-- ============================================
-- PASO 2: Agregar función para verificar si un pedido está completamente facturado
-- ============================================

CREATE OR REPLACE FUNCTION pedido_completamente_facturado(p_pedido_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    items_totales INTEGER;
    items_facturados INTEGER;
BEGIN
    -- Contar total de items del pedido
    SELECT COUNT(*) INTO items_totales
    FROM pedido_items
    WHERE pedido_id = p_pedido_id;

    -- Contar items facturados
    SELECT COUNT(*) INTO items_facturados
    FROM pedido_items
    WHERE pedido_id = p_pedido_id AND facturado = TRUE;

    -- Si todos los items están facturados, retornar TRUE
    RETURN (items_totales > 0 AND items_totales = items_facturados);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PASO 3: Agregar función para obtener posiciones no facturadas de un pedido
-- ============================================

CREATE OR REPLACE FUNCTION posiciones_no_facturadas(p_pedido_id INTEGER)
RETURNS TABLE(posicion INTEGER, cantidad_items BIGINT, monto_total NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pi.posicion,
        COUNT(*) as cantidad_items,
        SUM(pi.cantidad * pi.precio_unitario) as monto_total
    FROM pedido_items pi
    WHERE pi.pedido_id = p_pedido_id
      AND pi.facturado = FALSE
      AND pi.posicion IS NOT NULL
    GROUP BY pi.posicion
    ORDER BY pi.posicion;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PASO 4: Crear vista para pedidos con información de facturación parcial
-- ============================================

CREATE OR REPLACE VIEW vista_pedidos_facturacion AS
SELECT
    p.id,
    p.mesa_id,
    p.estado,
    p.total,
    p.fecha_hora,
    COUNT(DISTINCT pi.posicion) as total_posiciones,
    COUNT(DISTINCT CASE WHEN pi.facturado = TRUE THEN pi.posicion END) as posiciones_facturadas,
    COUNT(pi.id) as total_items,
    SUM(CASE WHEN pi.facturado = TRUE THEN 1 ELSE 0 END) as items_facturados,
    SUM(CASE WHEN pi.facturado = FALSE THEN pi.cantidad * pi.precio_unitario ELSE 0 END) as monto_pendiente,
    CASE
        WHEN COUNT(pi.id) = SUM(CASE WHEN pi.facturado = TRUE THEN 1 ELSE 0 END) THEN TRUE
        ELSE FALSE
    END as completamente_facturado
FROM pedidos p
LEFT JOIN pedido_items pi ON p.id = pi.pedido_id
WHERE p.estado IN ('pendiente', 'preparando', 'listo', 'entregado')
GROUP BY p.id;

-- ============================================
-- PASO 5: Comentarios para documentación
-- ============================================

COMMENT ON COLUMN pedido_items.facturado IS 'Indica si este item ya fue facturado (permite pago parcial)';
COMMENT ON COLUMN pedido_items.factura_id IS 'ID de la factura que incluye este item (si fue facturado)';
COMMENT ON COLUMN pedido_items.fecha_facturacion IS 'Fecha y hora en que se facturó este item';
COMMENT ON FUNCTION pedido_completamente_facturado IS 'Verifica si todos los items de un pedido han sido facturados';
COMMENT ON FUNCTION posiciones_no_facturadas IS 'Retorna las posiciones que aún no han sido facturadas en un pedido';
COMMENT ON VIEW vista_pedidos_facturacion IS 'Vista con información de facturación parcial de pedidos';

-- ============================================
-- Verificación
-- ============================================

SELECT 'Migración de pago parcial por posiciones completada exitosamente' as mensaje;
SELECT 'Campo agregado: pedido_items.facturado' as info;
SELECT 'Funciones creadas: pedido_completamente_facturado, posiciones_no_facturadas' as info;
SELECT 'Vista creada: vista_pedidos_facturacion' as info;
