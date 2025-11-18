import { useState, useEffect } from 'react';
import { pedidosAPI, productosAPI, mesasAPI } from '../services/api';

function Pedidos() {
  const [mesas, setMesas] = useState([]);
  const [mesaSeleccionada, setMesaSeleccionada] = useState('');
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas');
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);


  const [pedidoActual, setPedidoActual] = useState(null);
  const [mostrarPedidoActual, setMostrarPedidoActual] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [mesasRes, productosRes, categoriasRes] = await Promise.all([
        mesasAPI.getAll(),
        productosAPI.getAll(),
        productosAPI.getCategorias()
      ]);
      setMesas(mesasRes.data.filter(m => m.estado === 'libre' || m.estado === 'ocupada'));
      setProductos(productosRes.data.filter(p => p.disponible));
      setCategorias(categoriasRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const cargarPedidoActual = async (mesaId) => {
    try {
      const response = await pedidosAPI.getAll({ mesa_id: mesaId, estado: 'pendiente,preparando,listo' });
      if (response.data && response.data.length > 0) {
        const pedidoId = response.data[0].id;
        const pedidoDetalle = await pedidosAPI.getById(pedidoId);
        setPedidoActual(pedidoDetalle.data);
      } else {
        setPedidoActual(null);
      }
    } catch (error) {
      console.error('Error al cargar pedido actual:', error);
      setPedidoActual(null);
    }
  };

  const eliminarItemPedido = async (itemId) => {
    if (!window.confirm('¿Está seguro de eliminar este item del pedido?')) {
      return;
    }

    try {
      const response = await pedidosAPI.deleteItem(pedidoActual.id, itemId);

      if (response.data.pedidoEliminado) {
        alert('Pedido cancelado y mesa liberada');
        setPedidoActual(null);
        setMostrarPedidoActual(false);
        cargarDatos();
      } else {
        alert('Item eliminado correctamente');
        await cargarPedidoActual(mesaSeleccionada);
      }
    } catch (error) {
      console.error('Error al eliminar item:', error);
      alert('Error al eliminar el item');
    }
  };

  const handleMesaChange = async (e) => {
    const mesaId = e.target.value;
    setMesaSeleccionada(mesaId);

    if (mesaId) {
      await cargarPedidoActual(mesaId);
    } else {
      setPedidoActual(null);
    }
  };

  const productosFiltrados = categoriaSeleccionada === 'todas'
    ? productos
    : productos.filter(p => p.categoria_id === parseInt(categoriaSeleccionada));

  const agregarAlCarrito = (producto) => {
    const itemExistente = carrito.find(item => item.producto_id === producto.id);

    if (itemExistente) {
      setCarrito(carrito.map(item =>
        item.producto_id === producto.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      setCarrito([...carrito, {
        producto_id: producto.id,
        nombre: producto.nombre,
        precio_unitario: producto.precio,
        cantidad: 1
      }]);
    }
  };

  const quitarDelCarrito = (productoId) => {
    setCarrito(carrito.filter(item => item.producto_id !== productoId));
  };

  const actualizarCantidad = (productoId, nuevaCantidad) => {
    if (nuevaCantidad < 1) {
      quitarDelCarrito(productoId);
      return;
    }
    setCarrito(carrito.map(item =>
      item.producto_id === productoId
        ? { ...item, cantidad: nuevaCantidad }
        : item
    ));
  };

  const calcularSubtotal = () => {
    return carrito.reduce((sum, item) => sum + (parseFloat(item.precio_unitario) * item.cantidad), 0);
  };

  const calcularITBIS = () => {
    return calcularSubtotal() * 0.18;
  };

  const calcularTotal = () => {
    return calcularSubtotal() + calcularITBIS();
  };

  const enviarPedido = async () => {
    if (!mesaSeleccionada) {
      alert('Debes seleccionar una mesa');
      return;
    }

    if (carrito.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    setEnviando(true);
    try {
      const pedido = {
        mesa_id: parseInt(mesaSeleccionada),
        items: carrito.map(item => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario
        }))
      };

      const response = await pedidosAPI.create(pedido);
      alert(response.data.message || 'Pedido enviado a cocina exitosamente');


      setCarrito([]);


      if (mesaSeleccionada) {
        await cargarPedidoActual(mesaSeleccionada);
      }

      cargarDatos();
    } catch (error) {
      alert('Error al enviar pedido');
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <h1 className="text-3xl font-heading font-bold mb-6">Toma de Pedidos</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Mesa
            </label>
            <select
              value={mesaSeleccionada}
              onChange={handleMesaChange}
              className="input"
              required
            >
              <option value="">-- Seleccionar mesa --</option>
              {mesas.map(mesa => (
                <option key={mesa.id} value={mesa.id}>
                  Mesa #{mesa.numero} - {mesa.area_nombre} ({mesa.capacidad} personas) - {mesa.estado.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {pedidoActual && (
            <div className="card mb-4 bg-yellow-50 border-2 border-yellow-400">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-lg">Pedido Actual en Mesa</h3>
                <button
                  onClick={() => setMostrarPedidoActual(!mostrarPedidoActual)}
                  className="text-primary hover:underline text-sm"
                >
                  {mostrarPedidoActual ? 'Ocultar' : 'Ver Detalles'}
                </button>
              </div>

              <div className="text-sm text-gray-700 mb-2">
                <p>Pedido #{pedidoActual.id} - Estado: <span className="capitalize font-semibold">{pedidoActual.estado}</span></p>
                <p className="text-lg font-bold text-primary">Total: RD${parseFloat(pedidoActual.total).toFixed(2)}</p>
              </div>

              {mostrarPedidoActual && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-semibold text-sm mb-2">Items del Pedido:</h4>
                  {pedidoActual.items && pedidoActual.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded border">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.producto_nombre}</p>
                        <p className="text-xs text-gray-600">
                          {item.cantidad} x RD${parseFloat(item.precio_unitario).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold">
                          RD${(item.cantidad * parseFloat(item.precio_unitario)).toFixed(2)}
                        </p>
                        <button
                          onClick={() => eliminarItemPedido(item.id)}
                          className="text-danger hover:bg-danger/10 px-2 py-1 rounded text-sm"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="card mb-4">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setCategoriaSeleccionada('todas')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  categoriaSeleccionada === 'todas'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Todas
              </button>
              {categorias.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaSeleccionada(cat.id.toString())}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    categoriaSeleccionada === cat.id.toString()
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {productosFiltrados.map(producto => (
              <div key={producto.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{producto.nombre}</h3>
                    <p className="text-sm text-gray-600">{producto.descripcion}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xl font-bold text-primary">
                    RD$ {parseFloat(producto.precio).toFixed(2)}
                  </span>
                  <button
                    onClick={() => agregarAlCarrito(producto)}
                    className="btn btn-primary text-sm"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {productosFiltrados.length === 0 && (
            <div className="card text-center py-12">
              <p className="text-gray-500">No hay productos disponibles en esta categoría</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="card sticky top-4">
            <h2 className="text-xl font-bold mb-4">Carrito</h2>

            {carrito.length === 0 ? (
              <p className="text-gray-500 text-center py-8">El carrito está vacío</p>
            ) : (
              <>
                <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                  {carrito.map(item => (
                    <div key={item.producto_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.nombre}</p>
                        <p className="text-xs text-gray-600">RD$ {parseFloat(item.precio_unitario).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => actualizarCantidad(item.producto_id, item.cantidad - 1)}
                          className="w-6 h-6 rounded bg-gray-300 hover:bg-gray-400 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-medium">{item.cantidad}</span>
                        <button
                          onClick={() => actualizarCantidad(item.producto_id, item.cantidad + 1)}
                          className="w-6 h-6 rounded bg-primary text-white hover:bg-primary/90 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => quitarDelCarrito(item.producto_id)}
                        className="text-danger hover:text-danger/80"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">RD$ {calcularSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">ITBIS (18%):</span>
                    <span className="font-medium">RD$ {calcularITBIS().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-primary">RD$ {calcularTotal().toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={enviarPedido}
                  disabled={enviando || !mesaSeleccionada}
                  className="btn btn-success w-full mt-4"
                >
                  {enviando ? 'Enviando...' : 'Enviar a Cocina'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Pedidos;
