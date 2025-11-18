import { useState, useEffect } from 'react';
import { productosAPI } from '../services/api';

function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [busqueda, setBusqueda] = useState('');


  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);


  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria_id: '',
  });


  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 12;

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [productosRes, categoriasRes] = await Promise.all([
        productosAPI.getAll(),
        productosAPI.getCategorias(),
      ]);
      setProductos(productosRes.data);
      setCategorias(categoriasRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setProductoEditando(null);
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      categoria_id: categorias.length > 0 ? categorias[0].id : '',
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (producto) => {
    setModoEdicion(true);
    setProductoEditando(producto);
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: producto.precio,
      categoria_id: producto.categoria_id,
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setModoEdicion(false);
    setProductoEditando(null);
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      categoria_id: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre.trim() || !formData.precio) {
      alert('Nombre y precio son requeridos');
      return;
    }

    try {
      if (modoEdicion) {
        await productosAPI.update(productoEditando.id, formData);
        alert('Producto actualizado exitosamente');
      } else {
        await productosAPI.create(formData);
        alert('Producto creado exitosamente');
      }
      cerrarModal();
      cargarDatos();
    } catch (error) {
      console.error('Error al guardar producto:', error);
      alert('Error al guardar el producto');
    }
  };

  const toggleDisponibilidad = async (producto) => {
    try {
      await productosAPI.update(producto.id, {
        disponible: !producto.disponible,
      });
      cargarDatos();
    } catch (error) {
      console.error('Error al actualizar disponibilidad:', error);
      alert('Error al actualizar la disponibilidad');
    }
  };

  const formatearMoneda = (valor) => {
    return `RD$${parseFloat(valor).toFixed(2)}`;
  };


  const productosFiltrados = productos.filter((producto) => {
    const coincideBusqueda = producto.nombre
      .toLowerCase()
      .includes(busqueda.toLowerCase());
    const coincideCategoria =
      !filtroCategoria || producto.categoria_id === parseInt(filtroCategoria);
    return coincideBusqueda && coincideCategoria;
  });


  const indexUltimo = paginaActual * itemsPorPagina;
  const indexPrimero = indexUltimo - itemsPorPagina;
  const productosPaginados = productosFiltrados.slice(indexPrimero, indexUltimo);
  const totalPaginas = Math.ceil(productosFiltrados.length / itemsPorPagina);

  if (loading) {
    return (
      <div className="fade-in">
        <h1 className="text-3xl font-heading font-bold mb-8">Gestión de Productos</h1>
        <div className="card">
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-heading font-bold">Gestión de Productos</h1>
        <button onClick={abrirModalCrear} className="btn-primary">
          Nuevo Producto
        </button>
      </div>

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar Producto
            </label>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1);
              }}
              placeholder="Nombre del producto..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por Categoría
            </label>
            <select
              value={filtroCategoria}
              onChange={(e) => {
                setFiltroCategoria(e.target.value);
                setPaginaActual(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre} ({cat.num_productos})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        {productosPaginados.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No se encontraron productos
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productosPaginados.map((producto) => (
                <div
                  key={producto.id}
                  className={`border-2 rounded-lg p-4 transition-all ${
                    producto.disponible
                      ? 'border-gray-200 bg-white'
                      : 'border-gray-300 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{producto.nombre}</h3>
                      <p className="text-sm text-gray-600">{producto.categoria_nombre}</p>
                    </div>
                    <p className="font-bold text-primary text-lg ml-2">
                      {formatearMoneda(producto.precio)}
                    </p>
                  </div>

                  {producto.descripcion && (
                    <p className="text-sm text-gray-600 mb-4">
                      {producto.descripcion}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => abrirModalEditar(producto)}
                      className="flex-1 px-3 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => toggleDisponibilidad(producto)}
                      className={`flex-1 px-3 py-2 rounded-lg transition-colors text-sm ${
                        producto.disponible
                          ? 'bg-danger/10 text-danger hover:bg-danger/20'
                          : 'bg-success/10 text-success hover:bg-success/20'
                      }`}
                    >
                      {producto.disponible ? 'Desactivar' : 'Activar'}
                    </button>
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
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((numero) => (
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
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">
              {modoEdicion ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  placeholder="Nombre del producto"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                  placeholder="Descripción opcional"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precio}
                  onChange={(e) =>
                    setFormData({ ...formData, precio: e.target.value })
                  }
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <select
                  value={formData.categoria_id}
                  onChange={(e) =>
                    setFormData({ ...formData, categoria_id: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Sin categoría</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 btn-primary">
                  {modoEdicion ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Productos;
