import { useState } from 'react';
import { authAPI } from '../services/api';

function Login({ setIsAuthenticated }) {
  const [formData, setFormData] = useState({
    email: 'admin@cary.com',
    password: '123456'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
      setIsAuthenticated(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-heading font-bold text-primary mb-2">
              🍽️ Cary
            </h1>
            <p className="text-gray-600">Sistema de Gestión para Restaurantes</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                className="input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                className="input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full py-3 text-lg"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 font-semibold mb-2">
              Usuarios de prueba:
            </p>
            <div className="space-y-1 text-xs text-gray-500">
              <p>👤 admin@cary.com / 123456</p>
              <p>👤 carmen@cary.com / 123456</p>
              <p>👤 maria@cary.com / 123456</p>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Desarrollado por Fausto Tavarez & Christ Louis Medina
        </p>
      </div>
    </div>
  );
}

export default Login;
