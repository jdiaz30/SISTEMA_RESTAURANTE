import { useState, useEffect } from 'react';
import { mesasAPI, pedidosAPI, facturasAPI } from '../services/api';

function Facturacion() {
  const [mesasOcupadas, setMesasOcupadas] = useState([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [detallesPedido, setDetallesPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [tipoPago, setTipoPago] = useState('unico');
  const [clienteNombre, setClienteNombre] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [pagos, setPagos] = useState([]);
  const [nuevoPago, setNuevoPago] = useState({
    cliente_nombre: '',
    metodo_pago: 'efectivo',
    monto: '',
    referencia: '',
  });
  const [mostrarSeleccionProductos, setMostrarSeleccionProductos] = useState(false);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);

  useEffect(() => {
    cargarMesasOcupadas();
  }, []);

  const cargarMesasOcupadas = async () => {
    try {
      setLoading(true);
      const response = await mesasAPI.getOcupadasConPedidos();
      setMesasOcupadas(response.data);
    } catch (error) {
      console.error('Error al cargar mesas:', error);
      alert('Error al cargar mesas ocupadas');
    } finally {
      setLoading(false);
    }
  };

  const seleccionarPedido = async (pedido) => {
    try {
      setPedidoSeleccionado(pedido);
      const response = await pedidosAPI.getById(pedido.pedido_id);
      setDetallesPedido(response.data);
      setClienteNombre('');
      setMetodoPago('efectivo');
      setTipoPago('unico');
      setPagos([]);
      setNuevoPago({ cliente_nombre: '', metodo_pago: 'efectivo', monto: '', referencia: '' });
      setProductosSeleccionados([]);
      setMostrarSeleccionProductos(false);
    } catch (error) {
      console.error('Error al cargar detalles:', error);
      alert('Error al cargar detalles del pedido');
    }
  };

  const agregarPago = () => {
    if (!nuevoPago.cliente_nombre.trim()) {
      alert('Ingrese el nombre del cliente');
      return;
    }
    if (!nuevoPago.monto || parseFloat(nuevoPago.monto) <= 0) {
      alert('Ingrese un monto válido');
      return;
    }

    const pago = {
      ...nuevoPago,
      monto: parseFloat(nuevoPago.monto),
      productos: productosSeleccionados.length > 0 ? [...productosSeleccionados] : null
    };

    setPagos([...pagos, pago]);
    setNuevoPago({ cliente_nombre: '', metodo_pago: 'efectivo', monto: '', referencia: '' });
    setProductosSeleccionados([]);
  };

  const calcularMontoProductosSeleccionados = () => {
    if (!detallesPedido || productosSeleccionados.length === 0) return 0;

    return productosSeleccionados.reduce((sum, itemId) => {
      const item = detallesPedido.items.find(i => i.id === itemId);
      if (item) {
        return sum + (item.cantidad * item.precio_unitario);
      }
      return sum;
    }, 0);
  };

  const toggleProductoSeleccionado = (itemId) => {
    setProductosSeleccionados(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const aplicarMontoProductosSeleccionados = () => {
    const monto = calcularMontoProductosSeleccionados();
    if (monto > 0) {
      setNuevoPago({ ...nuevoPago, monto: monto.toFixed(2) });
      setMostrarSeleccionProductos(false);
    } else {
      alert('Debe seleccionar al menos un producto');
    }
  };

  const aplicarMontoRestante = () => {
    const restante = calcularRestante();
    if (restante > 0) {
      setNuevoPago({ ...nuevoPago, monto: restante.toFixed(2) });
    } else {
      alert('No hay monto restante por pagar');
    }
  };

  const eliminarPago = (index) => {
    setPagos(pagos.filter((_, i) => i !== index));
  };

  const dividirEquitativamente = () => {
    const numPersonas = prompt('¿Cuántas personas dividirán la cuenta?');
    if (!numPersonas || isNaN(numPersonas) || numPersonas < 2) {
      alert('Ingrese un número válido de personas (mínimo 2)');
      return;
    }

    const montoPorPersona = parseFloat(detallesPedido.total) / parseInt(numPersonas);
    const nuevosPagos = [];

    for (let i = 1; i <= parseInt(numPersonas); i++) {
      nuevosPagos.push({
        cliente_nombre: `Persona ${i}`,
        metodo_pago: 'efectivo',
        monto: parseFloat(montoPorPersona.toFixed(2)),
      });
    }

    setPagos(nuevosPagos);
  };

  const calcularTotalPagos = () => {
    return pagos.reduce((sum, pago) => sum + parseFloat(pago.monto), 0);
  };

  const calcularRestante = () => {
    return parseFloat(detallesPedido.total) - calcularTotalPagos();
  };

  const generarFactura = async () => {
    let pagosFinal = [];

    if (tipoPago === 'unico') {
      if (!clienteNombre.trim()) {
        alert('Por favor ingrese el nombre del cliente');
        return;
      }
      pagosFinal = [{
        cliente_nombre: clienteNombre,
        metodo_pago: metodoPago,
        monto: parseFloat(detallesPedido.total),
      }];
    } else {
      if (pagos.length === 0) {
        alert('Debe agregar al menos un pago');
        return;
      }

      const restante = calcularRestante();
      if (Math.abs(restante) > 0.01) {
        alert(`Falta pagar RD$${restante.toFixed(2)}. La suma debe ser igual al total.`);
        return;
      }

      pagosFinal = pagos;
    }

    try {
      setProcesando(true);
      const response = await facturasAPI.create({
        pedido_id: pedidoSeleccionado.pedido_id,
        mesa_id: pedidoSeleccionado.mesa_id,
        pagos: pagosFinal,
      });

      const facturaId = response.data.factura.id;
      const numeroMesa = pedidoSeleccionado.mesa_numero;

      alert(`✓ Factura generada exitosamente\n\nMesa ${numeroMesa} ha sido cerrada y liberada.\n\nSe abrirá la vista de impresión.`);

      window.open(`/factura/${facturaId}/imprimir`, '_blank');

      setPedidoSeleccionado(null);
      setDetallesPedido(null);
      setClienteNombre('');
      setMetodoPago('efectivo');
      setTipoPago('unico');
      setPagos([]);
      setNuevoPago({ cliente_nombre: '', metodo_pago: 'efectivo', monto: '', referencia: '' });
      setProductosSeleccionados([]);
      setMostrarSeleccionProductos(false);

      cargarMesasOcupadas();
    } catch (error) {
      console.error('Error al generar factura:', error);
      const mensaje = error.response?.data?.error || 'Error al generar la factura';
      alert(`✗ Error: ${mensaje}`);
    } finally {
      setProcesando(false);
    }
  };

  const formatearMoneda = (valor) => {
    return `RD$${parseFloat(valor).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="fade-in">
        <h1 className="text-3xl font-heading font-bold mb-8">Facturación</h1>
        <div className="card">
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <h1 className="text-3xl font-heading font-bold mb-8">Facturación</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Mesas Ocupadas</h2>

            {mesasOcupadas.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay mesas ocupadas en este momento
              </p>
            ) : (
              <div className="space-y-3">
                {mesasOcupadas.map((mesa) => (
                  <button
                    key={`${mesa.mesa_id}-${mesa.pedido_id}`}
                    onClick={() => seleccionarPedido(mesa)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      pedidoSeleccionado?.pedido_id === mesa.pedido_id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-lg">Mesa {mesa.mesa_numero}</p>
                        <p className="text-sm text-gray-600">{mesa.area_nombre}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Pedido #{mesa.pedido_id}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary text-lg">
                          {formatearMoneda(mesa.total)}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {mesa.pedido_estado.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          {!pedidoSeleccionado ? (
            <div className="card">
              <p className="text-gray-500 text-center py-8">
                Seleccione una mesa para generar la factura
              </p>
            </div>
          ) : (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">
                Detalles - Mesa {pedidoSeleccionado.mesa_numero}
              </h2>

              {detallesPedido && (
                <>
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3 text-gray-700">Items del Pedido</h3>
                    <div className="space-y-2">
                      {detallesPedido.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center py-2 border-b border-gray-100"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{item.producto_nombre}</p>
                            <p className="text-sm text-gray-500">
                              {item.cantidad} x {formatearMoneda(item.precio_unitario)}
                            </p>
                          </div>
                          <p className="font-semibold">
                            {formatearMoneda(item.cantidad * item.precio_unitario)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6 pt-4 border-t-2 border-gray-200">
                    <div className="space-y-2">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal:</span>
                        <span>{formatearMoneda(detallesPedido.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>ITBIS (18%):</span>
                        <span>{formatearMoneda(detallesPedido.impuesto)}</span>
                      </div>
                      <div className="flex justify-between text-xl font-bold text-primary pt-2 border-t border-gray-200">
                        <span>Total:</span>
                        <span>{formatearMoneda(detallesPedido.total)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Pago
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setTipoPago('unico')}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          tipoPago === 'unico'
                            ? 'border-primary bg-primary text-white'
                            : 'border-gray-300 hover:border-primary/50'
                        }`}
                      >
                        Pago Único
                      </button>
                      <button
                        onClick={() => setTipoPago('dividido')}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          tipoPago === 'dividido'
                            ? 'border-primary bg-primary text-white'
                            : 'border-gray-300 hover:border-primary/50'
                        }`}
                      >
                        Pago Dividido
                      </button>
                    </div>
                  </div>

                  {tipoPago === 'unico' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre del Cliente *
                        </label>
                        <input
                          type="text"
                          value={clienteNombre}
                          onChange={(e) => setClienteNombre(e.target.value)}
                          placeholder="Nombre completo"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Método de Pago
                        </label>
                        <select
                          value={metodoPago}
                          onChange={(e) => setMetodoPago(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="efectivo">Efectivo</option>
                          <option value="tarjeta">Tarjeta</option>
                          <option value="transferencia">Transferencia</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {tipoPago === 'dividido' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700">Pagos Agregados</h3>
                        <button
                          onClick={dividirEquitativamente}
                          className="text-sm text-primary hover:underline"
                        >
                          Dividir Equitativamente
                        </button>
                      </div>

                      {pagos.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {pagos.map((pago, index) => (
                            <div
                              key={index}
                              className="p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <p className="font-medium">{pago.cliente_nombre}</p>
                                  <p className="text-sm text-gray-600 capitalize">
                                    {pago.metodo_pago}
                                    {pago.referencia && (
                                      <span className="ml-2 text-xs">
                                        Ref: {pago.referencia}
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <p className="font-bold text-primary">
                                    {formatearMoneda(pago.monto)}
                                  </p>
                                  <button
                                    onClick={() => eliminarPago(index)}
                                    className="text-danger hover:bg-danger/10 p-1 rounded"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                              {pago.productos && pago.productos.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <p className="text-xs text-gray-500 mb-1">Productos consumidos:</p>
                                  <div className="space-y-1">
                                    {pago.productos.map((itemId) => {
                                      const item = detallesPedido.items.find(i => i.id === itemId);
                                      if (!item) return null;
                                      return (
                                        <p key={itemId} className="text-xs text-gray-600">
                                          • {item.producto_nombre} ({item.cantidad}x) - {formatearMoneda(item.cantidad * item.precio_unitario)}
                                        </p>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                          <div className="pt-3 border-t border-gray-200">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Total Pagado:</span>
                              <span className="font-semibold">
                                {formatearMoneda(calcularTotalPagos())}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Restante:</span>
                              <span
                                className={`font-semibold ${
                                  calcularRestante() > 0.01 ? 'text-danger' : 'text-success'
                                }`}
                              >
                                {formatearMoneda(calcularRestante())}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="border-t border-gray-200 pt-4 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre del Cliente
                          </label>
                          <input
                            type="text"
                            value={nuevoPago.cliente_nombre}
                            onChange={(e) =>
                              setNuevoPago({ ...nuevoPago, cliente_nombre: e.target.value })
                            }
                            placeholder="Nombre completo"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Método de Pago
                          </label>
                          <select
                            value={nuevoPago.metodo_pago}
                            onChange={(e) =>
                              setNuevoPago({ ...nuevoPago, metodo_pago: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="efectivo">Efectivo</option>
                            <option value="tarjeta">Tarjeta</option>
                            <option value="transferencia">Transferencia</option>
                          </select>
                        </div>

                        {(nuevoPago.metodo_pago === 'tarjeta' || nuevoPago.metodo_pago === 'transferencia') && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Número de Referencia {nuevoPago.metodo_pago === 'tarjeta' ? '/ Autorización' : ''}
                            </label>
                            <input
                              type="text"
                              value={nuevoPago.referencia}
                              onChange={(e) =>
                                setNuevoPago({ ...nuevoPago, referencia: e.target.value })
                              }
                              placeholder={nuevoPago.metodo_pago === 'tarjeta' ? 'Últimos 4 dígitos / Autorización' : 'Número de referencia'}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                        )}

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Monto a Pagar
                            </label>
                            <div className="flex gap-2">
                              {!mostrarSeleccionProductos && pagos.length > 0 && calcularRestante() > 0 && (
                                <button
                                  type="button"
                                  onClick={aplicarMontoRestante}
                                  className="text-xs text-success hover:underline font-medium"
                                >
                                  Usar restante ({formatearMoneda(calcularRestante())})
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setMostrarSeleccionProductos(!mostrarSeleccionProductos)}
                                className="text-xs text-primary hover:underline"
                              >
                                {mostrarSeleccionProductos ? 'Ingresar monto manual' : 'Seleccionar productos'}
                              </button>
                            </div>
                          </div>

                          {mostrarSeleccionProductos ? (
                            <div className="border border-gray-300 rounded-lg p-3 space-y-2">
                              <p className="text-xs text-gray-600 mb-2">
                                Seleccione los productos que consume este cliente:
                              </p>
                              <div className="max-h-48 overflow-y-auto space-y-2">
                                {detallesPedido.items.map((item) => (
                                  <label
                                    key={item.id}
                                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={productosSeleccionados.includes(item.id)}
                                      onChange={() => toggleProductoSeleccionado(item.id)}
                                      className="w-4 h-4 text-primary"
                                    />
                                    <div className="flex-1 text-sm">
                                      <span className="font-medium">{item.producto_nombre}</span>
                                      <span className="text-gray-500 ml-2">
                                        ({item.cantidad} x {formatearMoneda(item.precio_unitario)})
                                      </span>
                                    </div>
                                    <span className="text-sm font-semibold">
                                      {formatearMoneda(item.cantidad * item.precio_unitario)}
                                    </span>
                                  </label>
                                ))}
                              </div>
                              <div className="pt-2 border-t flex justify-between items-center">
                                <span className="text-sm font-medium">Subtotal seleccionado:</span>
                                <span className="text-lg font-bold text-primary">
                                  {formatearMoneda(calcularMontoProductosSeleccionados())}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={aplicarMontoProductosSeleccionados}
                                className="w-full px-3 py-2 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors text-sm"
                              >
                                Aplicar Monto
                              </button>
                            </div>
                          ) : (
                            <input
                              type="number"
                              step="0.01"
                              value={nuevoPago.monto}
                              onChange={(e) =>
                                setNuevoPago({ ...nuevoPago, monto: e.target.value })
                              }
                              placeholder="0.00"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          )}
                        </div>

                        <button
                          onClick={agregarPago}
                          className="w-full px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors"
                        >
                          Agregar Pago
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={generarFactura}
                      disabled={procesando}
                      className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {procesando ? 'Procesando...' : 'Generar Factura y Cerrar Mesa'}
                    </button>

                    <button
                      onClick={() => {
                        setPedidoSeleccionado(null);
                        setDetallesPedido(null);
                      }}
                      className="w-full px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Facturacion;
