-- ============================================
-- SISTEMA DE GESTIÓN RESTAURANTE CARY
-- Base de Datos - Schema Principal
-- ============================================

DROP DATABASE IF EXISTS cary_restaurant;
CREATE DATABASE cary_restaurant;

\c cary_restaurant;

-- Tabla de Usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) CHECK (rol IN ('admin', 'mesero', 'cajero')) NOT NULL DEFAULT 'mesero',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Áreas del Restaurante
CREATE TABLE areas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE
);

-- Tabla de Mesas
CREATE TABLE mesas (
    id SERIAL PRIMARY KEY,
    numero INTEGER NOT NULL UNIQUE,
    capacidad INTEGER NOT NULL CHECK (capacidad > 0),
    area_id INTEGER REFERENCES areas(id) ON DELETE SET NULL,
    estado VARCHAR(20) CHECK (estado IN ('libre', 'reservada', 'ocupada')) DEFAULT 'libre',
    activo BOOLEAN DEFAULT TRUE
);

-- Tabla de Reservaciones
CREATE TABLE reservas (
    id SERIAL PRIMARY KEY,
    cliente_nombre VARCHAR(100) NOT NULL,
    cliente_telefono VARCHAR(20) NOT NULL,
    cliente_email VARCHAR(100),
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    num_personas INTEGER NOT NULL CHECK (num_personas > 0),
    mesa_id INTEGER REFERENCES mesas(id) ON DELETE SET NULL,
    estado VARCHAR(20) CHECK (estado IN ('pendiente', 'confirmada', 'cancelada', 'completada')) DEFAULT 'pendiente',
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Categorías de Productos
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE
);

-- Tabla de Productos del Menú
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
    categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
    imagen_url VARCHAR(255),
    disponible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Pedidos
CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    mesa_id INTEGER REFERENCES mesas(id) ON DELETE SET NULL,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) CHECK (estado IN ('pendiente', 'preparando', 'listo', 'entregado', 'cancelado')) DEFAULT 'pendiente',
    subtotal DECIMAL(10,2) DEFAULT 0,
    impuesto DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    notas TEXT
);

-- Tabla de Items de Pedido
CREATE TABLE pedido_items (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES productos(id) ON DELETE SET NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL,
    posicion INTEGER,
    notas TEXT,
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED
);

-- Tabla de Facturas
CREATE TABLE facturas (
    id SERIAL PRIMARY KEY,
    numero_factura VARCHAR(50) UNIQUE NOT NULL,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE SET NULL,
    mesa_id INTEGER REFERENCES mesas(id) ON DELETE SET NULL,
    cliente_nombre VARCHAR(100),
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10,2) NOT NULL,
    impuesto DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(50) CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia')) NOT NULL,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_reservas_fecha ON reservas(fecha);
CREATE INDEX idx_reservas_estado ON reservas(estado);
CREATE INDEX idx_mesas_estado ON mesas(estado);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_mesa ON pedidos(mesa_id);
CREATE INDEX idx_facturas_fecha ON facturas(fecha_hora);

-- Vistas útiles
CREATE VIEW vista_mesas_disponibles AS
SELECT m.id, m.numero, m.capacidad, a.nombre as area, m.estado
FROM mesas m
LEFT JOIN areas a ON m.area_id = a.id
WHERE m.activo = TRUE;

CREATE VIEW vista_ventas_diarias AS
SELECT
    DATE(fecha_hora) as fecha,
    COUNT(*) as num_facturas,
    SUM(total) as total_ventas,
    SUM(subtotal) as subtotal,
    SUM(impuesto) as impuestos
FROM facturas
GROUP BY DATE(fecha_hora)
ORDER BY fecha DESC;

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar timestamps
CREATE TRIGGER trigger_usuarios_timestamp
BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_reservas_timestamp
BEFORE UPDATE ON reservas
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_productos_timestamp
BEFORE UPDATE ON productos
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

COMMENT ON DATABASE cary_restaurant IS 'Sistema de Gestión Integral para Restaurante Cary';
