-- Migración: Agregar tabla de pagos colaborativos
-- Fecha: 2025-01-15
-- Descripción: Permite dividir el pago de una factura entre múltiples personas

-- Crear tabla de pagos
CREATE TABLE IF NOT EXISTS factura_pagos (
    id SERIAL PRIMARY KEY,
    factura_id INTEGER NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
    cliente_nombre VARCHAR(255) NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia')),
    monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_factura_pagos_factura_id ON factura_pagos(factura_id);

-- Modificar tabla facturas para indicar si es pago dividido
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS pago_dividido BOOLEAN DEFAULT FALSE;

-- Comentarios
COMMENT ON TABLE factura_pagos IS 'Almacena los pagos individuales cuando una factura se divide entre varias personas';
COMMENT ON COLUMN factura_pagos.monto IS 'Monto pagado por esta persona';
COMMENT ON COLUMN facturas.pago_dividido IS 'Indica si la factura fue pagada por múltiples personas';

-- Verificación
SELECT 'Migración completada exitosamente' as mensaje;
