import { useState } from 'react';
import { reservasAPI } from '../services/api';

function VerificarReserva() {
  const [codigo, setCodigo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [reserva, setReserva] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cancelando, setCancelando] = useState(false);

  const handleVerificar = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setReserva(null);


    const telefonoNormalizado = telefono.replace(/\D/g, '');

    try {
      const response = await reservasAPI.verificar(codigo, telefonoNormalizado);
      setReserva(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al verificar la reserva');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async () => {
    if (!window.confirm('¿Estás seguro de cancelar esta reserva?')) {
      return;
    }

    const telefonoNormalizado = telefono.replace(/\D/g, '');
    setCancelando(true);
    try {
      await reservasAPI.cancelarPublica(codigo, telefonoNormalizado);
      setReserva({ ...reserva, estado: 'cancelada' });
      alert('Reserva cancelada exitosamente');
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cancelar la reserva');
    } finally {
      setCancelando(false);
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '';

    try {

      const partes = fecha.split('T')[0].split('-');
      const year = parseInt(partes[0]);
      const month = parseInt(partes[1]) - 1; 
      const day = parseInt(partes[2]);

      const date = new Date(year, month, day);


      if (isNaN(date.getTime())) {
        return fecha; 
      }

      return date.toLocaleDateString('es-DO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error al formatear fecha:', fecha, error);
      return fecha;
    }
  };

  const formatHora = (hora) => {
    if (!hora) return '';


    const [hours, minutes] = hora.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;

    return `${h12}:${minutes} ${ampm}`;
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      'pendiente': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'confirmada': 'bg-success/20 text-success border-success',
      'cancelada': 'bg-danger/20 text-danger border-danger',
      'completada': 'bg-secondary/20 text-secondary border-secondary'
    };
    return badges[estado] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoTexto = (estado) => {
    const textos = {
      'pendiente': 'Pendiente de confirmación',
      'confirmada': 'Confirmada',
      'cancelada': 'Cancelada',
      'completada': 'Completada'
    };
    return textos[estado] || estado;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-white to-primary/5 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-heading font-bold text-dark mb-2">
            Verificar Reserva
          </h1>
          <p className="text-gray-600">Consulta el estado de tu reserva</p>
        </div>

        <div className="card mb-6">
          <form onSubmit={handleVerificar} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código de Reserva
              </label>
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                className="input"
                placeholder="RES-20241213-1234"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
                className="input"
                placeholder="8095551234"
                maxLength="10"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Solo números, sin guiones</p>
            </div>

            {error && (
              <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Verificando...' : 'Verificar Reserva'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <a href="/reservar" className="text-secondary hover:underline text-sm">
              Volver a crear una reserva
            </a>
          </div>
        </div>

        {reserva && (
          <div className="card animate-fade-in">
            <div className="text-center mb-6">
              <div className={`inline-block px-6 py-3 rounded-full border-2 text-lg font-semibold ${getEstadoBadge(reserva.estado)}`}>
                {getEstadoTexto(reserva.estado)}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-3 border-b pb-2">Detalles de la Reserva</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Código:</span>
                    <span className="font-mono font-bold">{reserva.codigo_reserva}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nombre:</span>
                    <span className="font-medium">{reserva.cliente_nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Teléfono:</span>
                    <span>{reserva.cliente_telefono}</span>
                  </div>
                  {reserva.cliente_email && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="text-xs break-all">{reserva.cliente_email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-primary/5 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-3 border-b pb-2">Fecha y Hora</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Fecha</p>
                    <p className="font-medium capitalize">{formatFecha(reserva.fecha)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Hora</p>
                    <p className="font-medium text-lg">{formatHora(reserva.hora)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Personas</p>
                    <p className="font-medium">{reserva.num_personas} {reserva.num_personas === 1 ? 'persona' : 'personas'}</p>
                  </div>
                </div>
              </div>

              {reserva.mesa_numero && (
                <div className="bg-success/10 rounded-lg p-4 border border-success">
                  <h3 className="font-semibold text-success mb-2">Mesa Asignada</h3>
                  <p className="text-lg">
                    Mesa #{reserva.mesa_numero}
                    {reserva.area_nombre && ` - ${reserva.area_nombre}`}
                  </p>
                </div>
              )}

              {reserva.notas && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Notas</h3>
                  <p className="text-gray-600">{reserva.notas}</p>
                </div>
              )}

              {(reserva.estado === 'pendiente' || reserva.estado === 'confirmada') && (
                <button
                  onClick={handleCancelar}
                  disabled={cancelando}
                  className="btn btn-danger w-full"
                >
                  {cancelando ? 'Cancelando...' : 'Cancelar Reserva'}
                </button>
              )}

              {reserva.estado === 'cancelada' && (
                <div className="text-center text-gray-500 text-sm border-t pt-4">
                  Esta reserva ha sido cancelada
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Para modificar tu reserva, por favor cancela y crea una nueva.</p>
          <p className="mt-1">Contacto: (809) 555-2279</p>
        </div>
      </div>
    </div>
  );
}

export default VerificarReserva;
