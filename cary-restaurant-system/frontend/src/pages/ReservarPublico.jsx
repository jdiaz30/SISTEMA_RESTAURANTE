import { useState, useEffect } from 'react';
import { reservasAPI, mesasAPI } from '../services/api';

function ReservarPublico() {
  const [areas, setAreas] = useState([]);
  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    cliente_email: '',
    fecha: '',
    hora: '',
    num_personas: '',
    area_preferida: '',
    notas: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    cargarAreas();
  }, []);

  const cargarAreas = async () => {
    try {
      const response = await mesasAPI.getAreas();
      setAreas(response.data);
    } catch (error) {
      console.error('Error al cargar áreas:', error);
    }
  };

  const handleChange = (e) => {
    let value = e.target.value;


    if (e.target.name === 'cliente_telefono') {
      value = value.replace(/\D/g, ''); // Solo números
    }

    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(null);

    try {
      const response = await reservasAPI.create(formData);
      setSuccess(response.data);


      setFormData({
        cliente_nombre: '',
        cliente_telefono: '',
        cliente_email: '',
        fecha: '',
        hora: '',
        num_personas: '',
        area_preferida: '',
        notas: ''
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la reserva');
    } finally {
      setLoading(false);
    }
  };


  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-heading font-bold text-dark mb-2">
            Restaurante Cary
          </h1>
          <p className="text-gray-600">Reserva tu mesa en línea</p>
        </div>

        {success && (
          <div className="mb-6 bg-success/10 border-2 border-success rounded-xl p-6 text-center animate-fade-in">
            <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-success mb-2">Reserva Creada Exitosamente</h3>
            <p className="text-gray-700 mb-4">Tu código de reserva es:</p>
            <div className="bg-white border-2 border-success rounded-lg p-4 inline-block">
              <p className="text-3xl font-mono font-bold text-primary">
                {success.codigo}
              </p>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Guarda este código. Lo necesitarás para consultar o cancelar tu reserva.
            </p>
            <a
              href="/reservas/verificar"
              className="inline-block mt-4 text-secondary hover:underline font-medium"
            >
              Verificar mi reserva
            </a>
          </div>
        )}

        <div className="card">
          <h2 className="text-2xl font-heading font-bold mb-6 text-center">
            Completa tus datos
          </h2>

          {error && (
            <div className="mb-4 bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="cliente_nombre"
                value={formData.cliente_nombre}
                onChange={handleChange}
                className="input"
                required
                placeholder="Juan Pérez"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono <span className="text-danger">*</span>
              </label>
              <input
                type="tel"
                name="cliente_telefono"
                value={formData.cliente_telefono}
                onChange={handleChange}
                className="input"
                required
                placeholder="8095551234"
                maxLength="10"
              />
              <p className="text-xs text-gray-500 mt-1">Solo números, sin guiones</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico (opcional)
              </label>
              <input
                type="email"
                name="cliente_email"
                value={formData.cliente_email}
                onChange={handleChange}
                className="input"
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  min={today}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora <span className="text-danger">*</span>
                </label>
                <input
                  type="time"
                  name="hora"
                  value={formData.hora}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de personas <span className="text-danger">*</span>
              </label>
              <select
                name="num_personas"
                value={formData.num_personas}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="">Seleccionar...</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'persona' : 'personas'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Área preferida (opcional)
              </label>
              <select
                name="area_preferida"
                value={formData.area_preferida}
                onChange={handleChange}
                className="input"
              >
                <option value="">Sin preferencia (asignación automática)</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.nombre}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Si no seleccionas un área, el sistema asignará automáticamente según disponibilidad
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas especiales (opcional)
              </label>
              <textarea
                name="notas"
                value={formData.notas}
                onChange={handleChange}
                className="input"
                rows="3"
                placeholder="Ej: Celebración de cumpleaños, alergias alimentarias, etc."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-lg"
            >
              {loading ? 'Creando reserva...' : 'Reservar Mesa'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>¿Ya tienes una reserva?</p>
            <a
              href="/reservas/verificar"
              className="text-secondary hover:underline font-medium"
            >
              Verificar o cancelar reserva
            </a>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Horario de atención: Lunes a Domingo, 11:00 AM - 11:00 PM</p>
          <p className="mt-1">Para grupos mayores a 10 personas, llamar al: (809) 555-2279</p>
        </div>
      </div>
    </div>
  );
}

export default ReservarPublico;
