const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARES ====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ==================== RUTAS ====================
const authRoutes = require('./routes/auth');
const mesasRoutes = require('./routes/mesas');
const reservasRoutes = require('./routes/reservas');
const productosRoutes = require('./routes/productos');
const pedidosRoutes = require('./routes/pedidos');
const facturasRoutes = require('./routes/facturas');
const dashboardRoutes = require('./routes/dashboard');

app.use('/api/auth', authRoutes);
app.use('/api/mesas', mesasRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/facturas', facturasRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ==================== RUTA RAÍZ ====================
app.get('/', (req, res) => {
  res.json({
    message: '🍽️ Bienvenido al API de Restaurante Cary',
    version: '1.0.0',
    authors: ['Fausto Tavarez', 'Christ Louis Medina Ramos'],
    endpoints: {
      auth: '/api/auth',
      mesas: '/api/mesas',
      reservas: '/api/reservas',
      productos: '/api/productos',
      pedidos: '/api/pedidos',
      facturas: '/api/facturas',
      dashboard: '/api/dashboard'
    }
  });
});

// ==================== MANEJO DE ERRORES ====================
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ==================== INICIAR SERVIDOR ====================
app.listen(PORT, () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🍽️  RESTAURANTE CARY - SERVIDOR BACKEND');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀 Servidor corriendo en: http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
});

module.exports = app;
