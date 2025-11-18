import { useState, useEffect } from 'react';
import { mesasAPI } from '../services/api';

function Mesas() {
  const [mesas, setMesas] = useState([]);
  const [areas, setAreas] = useState([]);
  const [areaSeleccionada, setAreaSeleccionada] = useState('todas');
  const [loading, setLoading] = useState(true);
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [mesasRes, areasRes] = await Promise.all([
        mesasAPI.getAll(),
        mesasAPI.getAreas()
      ]);
      setMesas(mesasRes.data);
      setAreas(areasRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar mesas');
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (mesaId, nuevoEstado) => {
    try {
      await mesasAPI.updateEstado(mesaId, nuevoEstado);
      cargarDatos();
      setMesaSeleccionada(null);
      alert('Estado de mesa actualizado');
    } catch (error) {
      alert('Error al actualizar estado');
    }
  };

  const mesasFiltradas = areaSeleccionada === 'todas'
    ? mesas
    : mesas.filter(m => m.area_id === parseInt(areaSeleccionada));


  const mesasPorArea = areas.map(area => ({
    ...area,
    mesas: mesas.filter(m => m.area_id === area.id)
  }));

  const getEstadoColor = (estado) => {
    const colores = {
      'libre': 'bg-success/20 border-success text-success hover:bg-success/30',
      'ocupada': 'bg-danger/20 border-danger text-danger hover:bg-danger/30',
      'reservada': 'bg-accent/20 border-accent text-accent hover:bg-accent/30'
    };
    return colores[estado] || 'bg-gray-100 border-gray-300';
  };

  const getEstadoTexto = (estado) => {
    const textos = {
      'libre': 'Libre',
      'ocupada': 'Ocupada',
      'reservada': 'Reservada'
    };
    return textos[estado] || estado;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando mesas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <h1 className="text-3xl font-heading font-bold mb-6">Gestión de Mesas</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 card bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-success">
                {mesasFiltradas.filter(m => m.estado === 'libre').length}
              </p>
              <p className="text-sm text-gray-600">Libres</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-danger">
                {mesasFiltradas.filter(m => m.estado === 'ocupada').length}
              </p>
              <p className="text-sm text-gray-600">Ocupadas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent">
                {mesasFiltradas.filter(m => m.estado === 'reservada').length}
              </p>
              <p className="text-sm text-gray-600">Reservadas</p>
            </div>
          </div>
        </div>

        <div className="card bg-gray-50">
          <h3 className="font-semibold mb-3">Leyenda</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-success border-2 border-success"></div>
              <span className="text-sm">Libre</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-danger border-2 border-danger"></div>
              <span className="text-sm">Ocupada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-accent border-2 border-accent"></div>
              <span className="text-sm">Reservada</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filtrar por área
        </label>
        <select
          value={areaSeleccionada}
          onChange={(e) => setAreaSeleccionada(e.target.value)}
          className="input max-w-md"
        >
          <option value="todas">Todas las áreas</option>
          {areas.map(area => (
            <option key={area.id} value={area.id}>
              {area.nombre}
            </option>
          ))}
        </select>
      </div>

      {areaSeleccionada === 'todas' ? (

        <div className="space-y-6">
          {mesasPorArea.map(area => (
            <div key={area.id} className="card">
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200 flex items-center justify-between">
                <span>{area.nombre}</span>
                <span className="text-sm font-normal text-gray-600">
                  {area.mesas.length} mesas
                </span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {area.mesas.map(mesa => (
                  <div
                    key={mesa.id}
                    onClick={() => setMesaSeleccionada(mesa)}
                    className={`
                      p-6 rounded-xl border-2 cursor-pointer transition-all duration-200
                      flex flex-col items-center justify-center
                      ${getEstadoColor(mesa.estado)}
                    `}
                  >
                    <div className="text-3xl font-bold mb-1">#{mesa.numero}</div>
                    <div className="text-sm font-medium mb-1">{getEstadoTexto(mesa.estado)}</div>
                    <div className="text-xs text-gray-600">{mesa.capacidad} personas</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {mesasFiltradas.map(mesa => (
            <div
              key={mesa.id}
              onClick={() => setMesaSeleccionada(mesa)}
              className={`
                p-6 rounded-xl border-2 cursor-pointer transition-all duration-200
                flex flex-col items-center justify-center
                ${getEstadoColor(mesa.estado)}
              `}
            >
              <div className="text-3xl font-bold mb-1">#{mesa.numero}</div>
              <div className="text-sm font-medium mb-1">{getEstadoTexto(mesa.estado)}</div>
              <div className="text-xs text-gray-600">{mesa.capacidad} personas</div>
            </div>
          ))}
        </div>
      )}

      {mesaSeleccionada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Mesa #{mesaSeleccionada.numero}</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Capacidad:</span>
                <span className="font-medium">{mesaSeleccionada.capacidad} personas</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Área:</span>
                <span className="font-medium">{mesaSeleccionada.area_nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estado actual:</span>
                <span className={`font-medium px-3 py-1 rounded-full ${getEstadoColor(mesaSeleccionada.estado)}`}>
                  {getEstadoTexto(mesaSeleccionada.estado)}
                </span>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Cambiar estado manualmente:</p>
              <p className="text-xs text-gray-500 mb-3">
                Usa esto para clientes sin reserva (walk-in) o para liberar mesas
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => cambiarEstado(mesaSeleccionada.id, 'libre')}
                  disabled={mesaSeleccionada.estado === 'libre'}
                  className={`
                    w-full py-3 px-4 rounded-lg text-sm font-medium border-2 transition-all text-left
                    ${mesaSeleccionada.estado === 'libre'
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-[1.02]'
                    }
                    ${getEstadoColor('libre')}
                  `}
                >
                  <div className="font-semibold">Libre</div>
                  <div className="text-xs opacity-80">Mesa disponible</div>
                </button>

                <button
                  onClick={() => cambiarEstado(mesaSeleccionada.id, 'ocupada')}
                  disabled={mesaSeleccionada.estado === 'ocupada'}
                  className={`
                    w-full py-3 px-4 rounded-lg text-sm font-medium border-2 transition-all text-left
                    ${mesaSeleccionada.estado === 'ocupada'
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-[1.02]'
                    }
                    ${getEstadoColor('ocupada')}
                  `}
                >
                  <div className="font-semibold">Ocupada</div>
                  <div className="text-xs opacity-80">Clientes sentados (walk-in)</div>
                </button>

                <button
                  onClick={() => cambiarEstado(mesaSeleccionada.id, 'reservada')}
                  disabled={mesaSeleccionada.estado === 'reservada'}
                  className={`
                    w-full py-3 px-4 rounded-lg text-sm font-medium border-2 transition-all text-left
                    ${mesaSeleccionada.estado === 'reservada'
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-[1.02]'
                    }
                    ${getEstadoColor('reservada')}
                  `}
                >
                  <div className="font-semibold">Reservada</div>
                  <div className="text-xs opacity-80">Mesa apartada para reservación</div>
                </button>
              </div>
            </div>

            <button
              onClick={() => setMesaSeleccionada(null)}
              className="mt-6 w-full btn bg-gray-500 text-white hover:bg-gray-600"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Mesas;
