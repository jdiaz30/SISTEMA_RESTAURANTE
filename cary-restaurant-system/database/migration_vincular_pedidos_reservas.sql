-- Migración: Vincular pedidos con reservas
-- Fecha: 2025-01-27
-- Descripción: Agrega columna reserva_id a pedidos para vincular pedidos con reservas específicas
--              Esto permite diferenciar pedidos de diferentes clientes en la misma mesa

-- Agregar columna reserva_id a tabla pedidos
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS reserva_id INTEGER REFERENCES reservas(id) ON DELETE SET NULL;

-- Crear índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_pedidos_reserva ON pedidos(reserva_id);

-- Comentario
COMMENT ON COLUMN pedidos.reserva_id IS 'Vincula el pedido con una reserva específica para evitar mezclar pedidos de diferentes clientes en la misma mesa';

-- Verificación
SELECT 'Migración completada: pedidos ahora pueden vincularse con reservas' as mensaje;
