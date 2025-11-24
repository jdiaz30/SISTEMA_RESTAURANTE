-- Migración: Agregar columna area_preferida a tabla reservas
-- Fecha: 2025-11-24
-- Descripción: Permite guardar el área preferida del cliente al hacer reservas

BEGIN;

-- Agregar columna area_preferida (ID del área preferida)
ALTER TABLE reservas
ADD COLUMN area_preferida INTEGER REFERENCES areas(id) ON DELETE SET NULL;

-- Agregar columna codigo_reserva si no existe (por seguridad)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='reservas' AND column_name='codigo_reserva'
    ) THEN
        ALTER TABLE reservas ADD COLUMN codigo_reserva VARCHAR(50) UNIQUE;
    END IF;
END $$;

COMMIT;

-- Verificación
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'reservas'
ORDER BY ordinal_position;
