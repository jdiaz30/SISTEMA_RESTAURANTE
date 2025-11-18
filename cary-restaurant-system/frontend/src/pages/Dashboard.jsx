import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <h1 className="text-3xl font-heading font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-primary to-primary/80 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Ventas Hoy</p>
              <p className="text-3xl font-bold mt-2">
                ${stats?.ventas.total.toFixed(2) || '0.00'}
              </p>
              <p className="text-white/70 text-xs mt-1">
                {stats?.ventas.num_facturas || 0} facturas
              </p>
            </div>
            <div className="text-5xl">💰</div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-secondary to-secondary/80 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Mesas Ocupadas</p>
              <p className="text-3xl font-bold mt-2">
                {stats?.mesas.ocupada || 0} / {stats?.mesas.total || 0}
              </p>
              <p className="text-white/70 text-xs mt-1">
                {stats?.mesas.libre || 0} libres
              </p>
            </div>
            <div className="text-5xl">🪑</div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-success to-success/80 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Pedidos Completados</p>
              <p className="text-3xl font-bold mt-2">
                {stats?.pedidos.completados || 0}
              </p>
              <p className="text-white/70 text-xs mt-1">
                Hoy
              </p>
            </div>
            <div className="text-5xl">✅</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-heading font-semibold mb-4">
          🏆 Top 5 Productos Más Vendidos
        </h2>
        {stats?.top_productos.length > 0 ? (
          <div className="space-y-3">
            {stats.top_productos.map((producto, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📊'}
                  </span>
                  <span className="font-medium">{producto.nombre}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">
                    {producto.veces_vendido} vendidos
                  </p>
                  <p className="text-xs text-gray-500">
                    ${parseFloat(producto.total_vendido || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No hay datos de ventas para hoy
          </p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
