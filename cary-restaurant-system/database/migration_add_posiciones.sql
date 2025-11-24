ALTER TABLE pedido_items
ADD COLUMN IF NOT EXISTS posicion INTEGER;

COMMENT ON COLUMN pedido_items.posicion IS 'Número de posición/silla en la mesa (1, 2, 3, 4...)';
