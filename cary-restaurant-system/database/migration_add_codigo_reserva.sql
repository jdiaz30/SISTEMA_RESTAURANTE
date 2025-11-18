-- Migración: Agregar columna codigo_reserva a la tabla reservas
-- Ejecutar: psql -U postgres -d cary_restaurant -f database/migration_add_codigo_reserva.sql

\c cary_restaurant;

-- Agregar columna codigo_reserva si no existe
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS codigo_reserva VARCHAR(50) UNIQUE;

-- Generar códigos para reservas existentes
UPDATE reservas
SET codigo_reserva = 'RES-' || TO_CHAR(created_at, 'YYYYMMDD') || '-' || LPAD(id::TEXT, 4, '0')
WHERE codigo_reserva IS NULL;

SELECT 'Columna codigo_reserva agregada exitosamente' as status;
SELECT COUNT(*) as reservas_actualizadas FROM reservas WHERE codigo_reserva IS NOT NULL;
