import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Importar páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Mesas from './pages/Mesas';
import Reservas from './pages/Reservas';
import Pedidos from './pages/Pedidos';
import Facturacion from './pages/Facturacion';
import Productos from './pages/Productos';
import ImprimirFactura from './pages/ImprimirFactura';

// Páginas públicas (sin login)
import ReservarPublico from './pages/ReservarPublico';
import VerificarReserva from './pages/VerificarReserva';

// Layout
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay token en localStorage
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
        {/* Rutas Públicas (sin autenticación) */}
        <Route path="/reservar" element={<ReservarPublico />} />
        <Route path="/reservas/verificar" element={<VerificarReserva />} />

        {/* Ruta de Login */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login setIsAuthenticated={setIsAuthenticated} />
            )
          }
        />

        {/* Rutas Protegidas (Staff) */}
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <Layout setIsAuthenticated={setIsAuthenticated}>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/mesas" element={<Mesas />} />
                  <Route path="/reservas" element={<Reservas />} />
                  <Route path="/pedidos" element={<Pedidos />} />
                  <Route path="/facturacion" element={<Facturacion />} />
                  <Route path="/productos" element={<Productos />} />
                  <Route path="/factura/:id/imprimir" element={<ImprimirFactura />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
