import { Link, useLocation } from 'react-router-dom';

function Layout({ children, setIsAuthenticated }) {
  const location = useLocation();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setIsAuthenticated(false);
  };

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/reservas', icon: '📅', label: 'Reservas' },
    { path: '/mesas', icon: '🪑', label: 'Mesas' },
    { path: '/pedidos', icon: '📋', label: 'Pedidos' },
    { path: '/facturacion', icon: '💰', label: 'Facturación' },
  ];

  if (usuario.rol === 'admin') {
    menuItems.push({ path: '/productos', icon: '🍽️', label: 'Productos' });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-heading font-bold text-primary">
                🍽️ Cary
              </h1>
              <span className="ml-3 text-sm text-gray-500">
                Sistema de Gestión
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">
                  {usuario.nombre}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {usuario.rol}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-danger text-sm"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside className="w-64 bg-white shadow-sm min-h-screen border-r border-gray-200">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8 max-w-7xl">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;
