import { useState, useEffect } from 'react';
import { reservasAPI, mesasAPI } from '../services/api';

function Reservas() {
  const [reservas, setReservas] = useState([]);
  const [reservasFiltradas, setReservasFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;


  const [modalAsignarMesa, setModalAsignarMesa] = useState(false);
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
  const [mesas, setMesas] = useState([]);
  const [mesaSeleccionada, setMesaSeleccionada] = useState('');

  useEffect(() => {
    cargarReservas();
  }, [filtroFecha, filtroEstado]);

  useEffect(() => {
    filtrarReservas();
  }, [reservas, busqueda]);

  const cargarReservas = async () => {
    try {
      const params = {};
      if (filtroFecha) params.fecha = filtroFecha;
      if (filtroEstado) params.estado = filtroEstado;

      const response = await reservasAPI.getAll(params);
      setReservas(response.data);
    } catch (error) {
      console.error('Error al cargar reservas:', error);
      alert('Error al cargar reservas');
    } finally {
      setLoading(false);
    }
  };

  const filtrarReservas = () => {
    if (!busqueda.trim()) {
      setReservasFiltradas(reservas);
      setPaginaActual(1); 
      return;
    }

    const termino = busqueda.toLowerCase();
    const filtradas = reservas.filter(reserva =>
      reserva.cliente_nombre.toLowerCase().includes(termino) ||
      reserva.cliente_telefono.includes(termino) ||
      (reserva.codigo_reserva && reserva.codigo_reserva.toLowerCase().includes(termino))
    );
    setReservasFiltradas(filtradas);
    setPaginaActual(1); 
  };


  const indexUltimo = paginaActual * itemsPorPagina;
  const indexPrimero = indexUltimo - itemsPorPagina;
  const reservasPaginadas = reservasFiltradas.slice(indexPrimero, indexUltimo);
  const totalPaginas = Math.ceil(reservasFiltradas.length / itemsPorPagina);

  const abrirModalAsignarMesa = async (reserva) => {
    try {
      const response = await mesasAPI.getAll();

      const mesasDisponibles = response.data.filter(m =>
        m.estado === 'libre' || m.estado === 'reservada'
      );
      setMesas(mesasDisponibles);
      setReservaSeleccionada(reserva);
      setMesaSeleccionada(reserva.mesa_id || '');
      setModalAsignarMesa(true);
    } catch (error) {
      alert('Error al cargar mesas');
    }
  };

  const confirmarReserva = async () => {
    if (!mesaSeleccionada) {
      alert('Por favor seleccione una mesa');
      return;
    }

    try {
      await reservasAPI.update(reservaSeleccionada.id, {
        estado: 'confirmada',
        mesa_id: parseInt(mesaSeleccionada)
      });

      setModalAsignarMesa(false);
      cargarReservas();
      alert('Reserva confirmada y mesa asignada exitosamente');
    } catch (error) {
      alert('Error al confirmar reserva');
    }
  };

  const cancelarReserva = async (id) => {
    if (!window.confirm('¿Cancelar esta reserva?')) return;

    try {
      await reservasAPI.cancel(id);
      cargarReservas();
      alert('Reserva cancelada');
    } catch (error) {
      alert('Error al cancelar reserva');
    }
  };

  const marcarClienteLlego = async (reserva) => {
    if (!window.confirm(`¿Confirmar que el cliente ${reserva.cliente_nombre} ha llegado?\n\nEsto cambiará la mesa a ocupada y podrás tomar el pedido.`)) {
      return;
    }

    try {
      await reservasAPI.update(reserva.id, { estado: 'completada' });
      cargarReservas();
      alert(`✓ Cliente llegó\n\nMesa #${reserva.mesa_numero} ahora está ocupada.\nPuedes tomar el pedido en el módulo de Pedidos.`);
    } catch (error) {
      console.error('Error al marcar llegada:', error);
      alert('Error al procesar la llegada del cliente');
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
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
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
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'confirmada': 'bg-success/20 text-success',
      'cancelada': 'bg-danger/20 text-danger',
      'completada': 'bg-secondary/20 text-secondary'
    };
    return badges[estado] || 'bg-gray-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando reservas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-heading font-bold">Gestión de Reservas</h1>
        <a
          href="/reservar"
          target="_blank"
          className="btn btn-secondary text-sm"
        >
          Ver Link Público
        </a>
      </div>

      <div className="mb-6 card bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-yellow-600">
              {reservasFiltradas.filter(r => r.estado === 'pendiente').length}
            </p>
            <p className="text-sm text-gray-600">Pendientes</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-success">
              {reservasFiltradas.filter(r => r.estado === 'confirmada').length}
            </p>
            <p className="text-sm text-gray-600">Confirmadas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-secondary">
              {reservasFiltradas.filter(r => r.estado === 'completada').length}
            </p>
            <p className="text-sm text-gray-600">Completadas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-danger">
              {reservasFiltradas.filter(r => r.estado === 'cancelada').length}
            </p>
            <p className="text-sm text-gray-600">Canceladas</p>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Buscar por nombre, teléfono o código
        </label>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input"
          placeholder="Ej: Juan Pérez, 8095551234, RES-20251113-8022"
        />
      </div>

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha
            </label>
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="input"
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFiltroFecha('');
                setFiltroEstado('');
                setBusqueda('');
              }}
              className="btn bg-gray-500 text-white hover:bg-gray-600 w-full"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {reservasFiltradas.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">
            {busqueda ? 'No se encontraron reservas con ese criterio de búsqueda' : 'No hay reservas para los filtros seleccionados'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {reservasPaginadas.map((reserva) => (
            <div key={reserva.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-bold">{reserva.cliente_nombre}</h3>
                      <p className="text-sm text-gray-600">{reserva.cliente_telefono}</p>
                      {reserva.cliente_email && (
                        <p className="text-sm text-gray-600">{reserva.cliente_email}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoBadge(reserva.estado)}`}>
                      {reserva.estado.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                    <div>
                      <span className="text-gray-500">Fecha:</span>
                      <p className="font-medium">{formatFecha(reserva.fecha)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Hora:</span>
                      <p className="font-medium">{formatHora(reserva.hora)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Personas:</span>
                      <p className="font-medium">{reserva.num_personas} {reserva.num_personas === 1 ? 'persona' : 'personas'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Mesa:</span>
                      <p className="font-medium">
                        {reserva.mesa_numero ? `#${reserva.mesa_numero}` : 'Sin asignar'}
                      </p>
                    </div>
                  </div>

                  {reserva.codigo_reserva && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">Código: </span>
                      <span className="text-xs font-mono font-bold">{reserva.codigo_reserva}</span>
                    </div>
                  )}

                  {reserva.notas && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                      <span className="text-gray-500">Notas:</span> {reserva.notas}
                    </div>
                  )}
                </div>

                <div className="flex md:flex-col gap-2 md:w-32">
                  {reserva.estado === 'pendiente' && (
                    <button
                      onClick={() => abrirModalAsignarMesa(reserva)}
                      className="btn btn-success text-xs flex-1"
                    >
                      Asignar Mesa
                    </button>
                  )}

                  {reserva.estado === 'confirmada' && (
                    <button
                      onClick={() => marcarClienteLlego(reserva)}
                      className="btn btn-secondary text-xs flex-1"
                    >
                      Cliente Llegó
                    </button>
                  )}

                  {(reserva.estado === 'pendiente' || reserva.estado === 'confirmada') && (
                    <button
                      onClick={() => cancelarReserva(reserva.id)}
                      className="btn btn-danger text-xs flex-1"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          </div>

          {totalPaginas > 1 && (
            <div className="mt-6 flex justify-center items-center gap-2">
              <button
                onClick={() => setPaginaActual(paginaActual - 1)}
                disabled={paginaActual === 1}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>

              <div className="flex gap-2">
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(numero => (
                  <button
                    key={numero}
                    onClick={() => setPaginaActual(numero)}
                    className={`px-4 py-2 rounded-lg ${
                      paginaActual === numero
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {numero}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPaginaActual(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {modalAsignarMesa && reservaSeleccionada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Asignar Mesa</h2>

            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-700">
                <strong>Cliente:</strong> {reservaSeleccionada.cliente_nombre}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Personas:</strong> {reservaSeleccionada.numero_personas}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Área preferida:</strong> {reservaSeleccionada.area_nombre || 'Sin preferencia'}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Mesa *
              </label>
              <select
                value={mesaSeleccionada}
                onChange={(e) => setMesaSeleccionada(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">-- Seleccionar mesa --</option>
                {mesas.map(mesa => (
                  <option key={mesa.id} value={mesa.id}>
                    Mesa #{mesa.numero} - {mesa.area} ({mesa.capacidad} personas) - {mesa.estado.toUpperCase()}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Mostrando mesas libres y reservadas
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmarReserva}
                className="flex-1 btn-primary"
              >
                Confirmar Reserva
              </button>
              <button
                onClick={() => setModalAsignarMesa(false)}
                className="flex-1 px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reservas;
