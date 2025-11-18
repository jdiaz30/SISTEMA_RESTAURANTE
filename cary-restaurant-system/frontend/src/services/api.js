import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ====================
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
};

// ==================== MESAS ====================
export const mesasAPI = {
  getAll: () => api.get('/mesas'),
  getByArea: (areaId) => api.get(`/mesas/area/${areaId}`),
  updateEstado: (id, estado) => api.patch(`/mesas/${id}/estado`, { estado }),
  getAreas: () => api.get('/mesas/areas'),
  getOcupadasConPedidos: () => api.get('/mesas/ocupadas-con-pedidos'),
};

// ==================== RESERVAS ====================
export const reservasAPI = {
  // Para staff (con autenticación)
  getAll: (params) => api.get('/reservas', { params }),
  getById: (id) => api.get(`/reservas/${id}`),
  create: (data) => api.post('/reservas', data),
  update: (id, data) => api.put(`/reservas/${id}`, data),
  cancel: (id) => api.delete(`/reservas/${id}`),

  // Para clientes (sin autenticación)
  verificar: (codigo, telefono) =>
    axios.post(`${API_URL}/reservas/verificar`, { codigo_reserva: codigo, telefono }),
  cancelarPublica: (codigo, telefono) =>
    axios.post(`${API_URL}/reservas/cancelar-publica`, { codigo_reserva: codigo, telefono }),
};

// ==================== PRODUCTOS ====================
export const productosAPI = {
  getAll: (params) => api.get('/productos', { params }),
  getCategorias: () => api.get('/productos/categorias'),
  create: (data) => api.post('/productos', data),
  update: (id, data) => api.put(`/productos/${id}`, data),
};

// ==================== PEDIDOS ====================
export const pedidosAPI = {
  getAll: (params) => api.get('/pedidos', { params }),
  getById: (id) => api.get(`/pedidos/${id}`),
  create: (data) => api.post('/pedidos', data),
  updateEstado: (id, estado) => api.patch(`/pedidos/${id}/estado`, { estado }),
  deleteItem: (pedidoId, itemId) => api.delete(`/pedidos/${pedidoId}/items/${itemId}`),
};

// ==================== FACTURAS ====================
export const facturasAPI = {
  getAll: (params) => api.get('/facturas', { params }),
  getById: (id) => api.get(`/facturas/${id}`),
  create: (data) => api.post('/facturas', data),
};

// ==================== DASHBOARD ====================
export const dashboardAPI = {
  getStats: (fecha) => api.get('/dashboard/stats', { params: { fecha } }),
};

export default api;
