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
  const [metodosMultiples, setMetodosMultiples] = useState(false);
  const [metodosPagoUnico, setMetodosPagoUnico] = useState([
    { metodo: 'efectivo', monto: '', referencia: '' }
  ]);
  const [pagos, setPagos] = useState([]);
  const [nuevoPago, setNuevoPago] = useState({
    cliente_nombre: '',
    metodo_pago: 'efectivo',
    monto: '',
    referencia: '',
  });
  const [metodosPagoDividido, setMetodosPagoDividido] = useState([
    { metodo: 'efectivo', monto: '', referencia: '' }
  ]);
  const [usarMetodosMultiplesDividido, setUsarMetodosMultiplesDividido] = useState(false);
  const [mostrarSeleccionProductos, setMostrarSeleccionProductos] = useState(false);
  const [mostrarPosiciones, setMostrarPosiciones] = useState(false);
  const [posicionesSeleccionadas, setPosicionesSeleccionadas] = useState([]);
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
      // PRIMERO: Limpiar TODO el estado ANTES de cargar
      setPedidoSeleccionado(null);
      setDetallesPedido(null);
      setClienteNombre('');
      setMetodoPago('efectivo');
      setMetodosMultiples(false);
      setMetodosPagoUnico([{ metodo: 'efectivo', monto: '', referencia: '' }]);
      setTipoPago('unico');
      setPagos([]); // ← CRÍTICO: Limpiar pagos ANTES de cargar el pedido
      setNuevoPago({ cliente_nombre: '', metodo_pago: 'efectivo', monto: '', referencia: '' });
      setProductosSeleccionados([]);
      setPosicionesSeleccionadas([]);
      setMostrarSeleccionProductos(false);
      setMostrarPosiciones(false);

      // SEGUNDO: Cargar el pedido con items NO facturados
      const response = await pedidosAPI.getById(pedido.pedido_id);

      // TERCERO: Actualizar estados
      setPedidoSeleccionado(pedido);
      setDetallesPedido(response.data);
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

    if (usarMetodosMultiplesDividido) {
      const totalMetodos = metodosPagoDividido.reduce((sum, m) => sum + (parseFloat(m.monto) || 0), 0);

      if (totalMetodos <= 0) {
        alert('Debe ingresar al menos un método de pago con monto válido');
        return;
      }

      metodosPagoDividido
        .filter(m => parseFloat(m.monto) > 0)
        .forEach(m => {
          const pago = {
            cliente_nombre: nuevoPago.cliente_nombre,
            metodo_pago: m.metodo,
            monto: parseFloat(m.monto),
            referencia: m.referencia || undefined,
            productos: productosSeleccionados.length > 0 ? [...productosSeleccionados] : null,
            posiciones: posicionesSeleccionadas.length > 0 ? [...posicionesSeleccionadas] : null
          };
          setPagos(prev => [...prev, pago]);
        });

      setMetodosPagoDividido([{ metodo: 'efectivo', monto: '', referencia: '' }]);
      setUsarMetodosMultiplesDividido(false);
    } else {
      if (!nuevoPago.monto || parseFloat(nuevoPago.monto) <= 0) {
        alert('Ingrese un monto válido');
        return;
      }

      const pago = {
        ...nuevoPago,
        monto: parseFloat(nuevoPago.monto),
        productos: productosSeleccionados.length > 0 ? [...productosSeleccionados] : null,
        posiciones: posicionesSeleccionadas.length > 0 ? [...posicionesSeleccionadas] : null
      };

      setPagos([...pagos, pago]);
    }

    setNuevoPago({ cliente_nombre: '', metodo_pago: 'efectivo', monto: '', referencia: '' });
    setProductosSeleccionados([]);
    setPosicionesSeleccionadas([]);
  };

  const calcularMontoProductosSeleccionados = () => {
    if (!detallesPedido || productosSeleccionados.length === 0) return 0;

    const subtotal = productosSeleccionados.reduce((sum, itemId) => {
      const item = detallesPedido.items.find(i => i.id === itemId);
      if (item) {
        return sum + (item.cantidad * item.precio_unitario);
      }
      return sum;
    }, 0);

    const impuesto = subtotal * 0.18;
    return subtotal + impuesto;
  };

  const calcularMontoPosicionesSeleccionadas = () => {
    if (!detallesPedido || posicionesSeleccionadas.length === 0) return 0;

    const subtotal = detallesPedido.items
      .filter(item => posicionesSeleccionadas.includes(item.posicion))
      .reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);

    const impuesto = subtotal * 0.18;
    return subtotal + impuesto;
  };

  const getPosicionesDisponibles = () => {
    if (!detallesPedido || !detallesPedido.items) return [];

    const posiciones = [...new Set(detallesPedido.items
      .map(item => item.posicion)
      .filter(pos => pos !== null && pos !== undefined)
    )];

    return posiciones.sort((a, b) => a - b);
  };

  const togglePosicionSeleccionada = (posicion) => {
    setPosicionesSeleccionadas(prev => {
      if (prev.includes(posicion)) {
        return prev.filter(p => p !== posicion);
      } else {
        return [...prev, posicion];
      }
    });
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

  const aplicarMontoPosicionesSeleccionadas = () => {
    const monto = calcularMontoPosicionesSeleccionadas();
    if (monto > 0) {
      setNuevoPago({ ...nuevoPago, monto: monto.toFixed(2) });
      setMostrarPosiciones(false);
    } else {
      alert('Debe seleccionar al menos una posición');
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

  // Calcular total de items NO facturados (solo los que se pueden pagar)
  const calcularTotalPendiente = () => {
    if (!detallesPedido || !detallesPedido.items) return 0;

    // Sumar solo los items que NO están en la lista de pagos ya agregados
    const itemsYaPagados = new Set();
    pagos.forEach(pago => {
      if (pago.productos) {
        pago.productos.forEach(id => itemsYaPagados.add(id));
      }
      if (pago.posiciones) {
        detallesPedido.items
          .filter(item => pago.posiciones.includes(item.posicion))
          .forEach(item => itemsYaPagados.add(item.id));
      }
    });

    // Calcular subtotal de items pendientes
    const subtotalPendiente = detallesPedido.items
      .filter(item => !itemsYaPagados.has(item.id))
      .reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);

    const impuestoPendiente = subtotalPendiente * 0.18;
    return subtotalPendiente + impuestoPendiente;
  };

  const calcularRestante = () => {
    return calcularTotalPendiente() - calcularTotalPagos();
  };

  const agregarMetodoPago = () => {
    setMetodosPagoUnico([...metodosPagoUnico, { metodo: 'efectivo', monto: '', referencia: '' }]);
  };

  const eliminarMetodoPago = (index) => {
    if (metodosPagoUnico.length > 1) {
      setMetodosPagoUnico(metodosPagoUnico.filter((_, i) => i !== index));
    }
  };

  const actualizarMetodoPago = (index, campo, valor) => {
    const nuevosMetodos = [...metodosPagoUnico];
    nuevosMetodos[index][campo] = valor;
    setMetodosPagoUnico(nuevosMetodos);
  };

  const calcularTotalMetodosPagoUnico = () => {
    return metodosPagoUnico.reduce((sum, metodo) => {
      return sum + (parseFloat(metodo.monto) || 0);
    }, 0);
  };

  const agregarMetodoPagoDividido = () => {
    setMetodosPagoDividido([...metodosPagoDividido, { metodo: 'efectivo', monto: '', referencia: '' }]);
  };

  const eliminarMetodoPagoDividido = (index) => {
    if (metodosPagoDividido.length > 1) {
      setMetodosPagoDividido(metodosPagoDividido.filter((_, i) => i !== index));
    }
  };

  const actualizarMetodoPagoDividido = (index, campo, valor) => {
    const nuevosMetodos = [...metodosPagoDividido];
    nuevosMetodos[index][campo] = valor;
    setMetodosPagoDividido(nuevosMetodos);
  };

  const calcularTotalMetodosPagoDividido = () => {
    return metodosPagoDividido.reduce((sum, metodo) => {
      return sum + (parseFloat(metodo.monto) || 0);
    }, 0);
  };

  const generarFactura = async () => {
    let pagosFinal = [];

    // Calcular total PENDIENTE (items no facturados)
    const subtotalPendiente = detallesPedido.items.reduce((sum, item) =>
      sum + (item.cantidad * item.precio_unitario), 0
    );
    const totalPendiente = subtotalPendiente * 1.18; // Incluir ITBIS

    if (tipoPago === 'unico') {
      if (!clienteNombre.trim()) {
        alert('Por favor ingrese el nombre del cliente');
        return;
      }

      if (metodosMultiples) {
        const totalMetodos = calcularTotalMetodosPagoUnico();
        if (Math.abs(totalMetodos - totalPendiente) > 0.01) {
          alert(`La suma de los métodos de pago (RD$${totalMetodos.toFixed(2)}) debe ser igual al total pendiente (RD$${totalPendiente.toFixed(2)})`);
          return;
        }

        pagosFinal = metodosPagoUnico
          .filter(m => parseFloat(m.monto) > 0)
          .map(m => ({
            cliente_nombre: clienteNombre,
            metodo_pago: m.metodo,
            monto: parseFloat(m.monto),
            referencia: m.referencia || undefined
          }));

        if (pagosFinal.length === 0) {
          alert('Debe ingresar al menos un método de pago con monto válido');
          return;
        }
      } else {
        pagosFinal = [{
          cliente_nombre: clienteNombre,
          metodo_pago: metodoPago,
          monto: totalPendiente, // Usar total PENDIENTE no el original
        }];
      }
    } else {
      if (pagos.length === 0) {
        alert('Debe agregar al menos un pago');
        return;
      }

      // Filtrar pagos para SOLO incluir posiciones/productos que NO estén facturados
      // Obtener posiciones que tienen items en detallesPedido (los no facturados)
      const posicionesDisponibles = new Set(
        detallesPedido.items.map(item => item.posicion).filter(p => p != null)
      );
      const productosDisponibles = new Set(
        detallesPedido.items.map(item => item.id)
      );

      pagosFinal = pagos.filter(pago => {
        // Si el pago tiene posiciones, verificar que al menos una esté disponible
        if (pago.posiciones && pago.posiciones.length > 0) {
          return pago.posiciones.some(pos => posicionesDisponibles.has(pos));
        }
        // Si el pago tiene productos, verificar que al menos uno esté disponible
        if (pago.productos && pago.productos.length > 0) {
          return pago.productos.some(prod => productosDisponibles.has(prod));
        }
        // Si no tiene ni posiciones ni productos específicos, incluirlo
        return true;
      });

      if (pagosFinal.length === 0) {
        alert('No hay pagos válidos para facturar. Las posiciones/productos seleccionados ya fueron facturados.');
        return;
      }
    }

    try {
      setProcesando(true);
      const response = await facturasAPI.create({
        pedido_id: pedidoSeleccionado.pedido_id,
        mesa_id: pedidoSeleccionado.mesa_id,
        pagos: pagosFinal,
      });

      const numeroMesa = pedidoSeleccionado.mesa_numero;
      const facturas = response.data.facturas;
      const esPagoDividido = response.data.pago_dividido;
      const mesaCerrada = response.data.mesa_cerrada;
      const itemsPendientes = response.data.items_pendientes;

      if (esPagoDividido) {
        // Múltiples facturas generadas
        const estadoMesa = mesaCerrada
          ? 'Mesa ha sido cerrada y liberada.'
          : 'Mesa sigue activa. Hay posiciones pendientes de facturar.';

        alert(`✓ ${facturas.length} facturas generadas exitosamente\n\n${estadoMesa}\n\nSe abrirán las vistas de impresión de cada factura.`);

        // Abrir ventana de impresión para cada factura
        facturas.forEach((factura, index) => {
          setTimeout(() => {
            window.open(`/factura/${factura.id}/imprimir`, '_blank');
          }, index * 500); // Delay de 500ms entre ventanas para evitar bloqueos
        });
      } else {
        // Una sola factura
        const facturaId = facturas[0].id;
        const estadoMesa = mesaCerrada
          ? 'Mesa ha sido cerrada y liberada.'
          : 'Mesa sigue activa. Hay items pendientes de facturar.';

        alert(`✓ Factura generada exitosamente\n\n${estadoMesa}\n\nSe abrirá la vista de impresión.`);
        window.open(`/factura/${facturaId}/imprimir`, '_blank');
      }

      // Si la mesa fue cerrada, resetear todo
      if (mesaCerrada) {
        setPedidoSeleccionado(null);
        setDetallesPedido(null);
        setClienteNombre('');
        setMetodoPago('efectivo');
        setMetodosMultiples(false);
        setMetodosPagoUnico([{ metodo: 'efectivo', monto: '', referencia: '' }]);
        setTipoPago('unico');
        setPagos([]);
        setNuevoPago({ cliente_nombre: '', metodo_pago: 'efectivo', monto: '', referencia: '' });
        setProductosSeleccionados([]);
        setPosicionesSeleccionadas([]);
        setMostrarSeleccionProductos(false);
        setMostrarPosiciones(false);
        cargarMesasOcupadas();
      } else {
        // Si la mesa sigue activa (pago parcial), recargar el pedido actualizado
        const pedidoActualizado = await pedidosAPI.getById(pedidoSeleccionado.pedido_id);
        setDetallesPedido(pedidoActualizado.data);

        // Limpiar solo los campos de pago, mantener el pedido seleccionado
        setClienteNombre('');
        setMetodoPago('efectivo');
        setMetodosMultiples(false);
        setMetodosPagoUnico([{ metodo: 'efectivo', monto: '', referencia: '' }]);
        setTipoPago('unico');
        setPagos([]);
        setNuevoPago({ cliente_nombre: '', metodo_pago: 'efectivo', monto: '', referencia: '' });
        setProductosSeleccionados([]);
        setPosicionesSeleccionadas([]);
        setMostrarSeleccionProductos(false);
        setMostrarPosiciones(false);

        // Recargar las mesas para actualizar el monto en la tarjeta
        cargarMesasOcupadas();
      }
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
                          pendiente
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
                    <h3 className="font-semibold mb-3 text-gray-700">
                      Items del Pedido
                      {getPosicionesDisponibles().length > 0 && <span className="text-sm text-gray-500 ml-2">(por Posición)</span>}
                    </h3>
                    {getPosicionesDisponibles().length > 0 ? (
                      <div className="space-y-3">
                        {getPosicionesDisponibles().map((posicion) => {
                          const itemsPosicion = detallesPedido.items.filter(item => item.posicion === posicion);
                          const subtotalPosicion = itemsPosicion.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
                          const impuestoPosicion = subtotalPosicion * 0.18;
                          const totalPosicion = subtotalPosicion + impuestoPosicion;
                          const posicionYaPagada = tipoPago === 'dividido' && pagos.some(p => p.posiciones && p.posiciones.includes(posicion));

                          return (
                            <div key={posicion} className={`border ${posicionYaPagada ? 'border-success bg-success/5' : 'border-secondary/20'} rounded-lg p-3 mb-3 relative`}>
                              {posicionYaPagada && (
                                <div className="absolute top-2 right-2 bg-success text-white text-xs px-2 py-1 rounded-full font-semibold">
                                  ✓ Pagado
                                </div>
                              )}
                              <div className="flex items-center justify-between mb-2 bg-secondary/10 px-2 py-1 rounded">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-xs">
                                    {posicion}
                                  </div>
                                  <span className="text-sm font-semibold text-gray-700">Posición {posicion}</span>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">Total con ITBIS:</p>
                                  <p className="font-bold text-secondary">{formatearMoneda(totalPosicion)}</p>
                                </div>
                              </div>
                              {itemsPosicion.map((item, index) => (
                                <div
                                  key={index}
                                  className="flex justify-between items-center py-2 border-b border-gray-100 ml-4"
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
                              {tipoPago === 'dividido' && !posicionYaPagada && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    console.log('Click en botón - Posición:', posicion);
                                    console.log('Items del pedido:', detallesPedido.items);

                                    // Obtener los IDs de productos de esta posición
                                    const productosDeEstaPosicion = detallesPedido.items
                                      .filter(item => item.posicion === posicion)
                                      .map(item => item.id);

                                    console.log('Productos de esta posición:', productosDeEstaPosicion);
                                    console.log('Total posición:', totalPosicion);

                                    setNuevoPago({
                                      cliente_nombre: `Posición ${posicion}`,
                                      metodo_pago: 'efectivo',
                                      monto: totalPosicion.toFixed(2),
                                      referencia: ''
                                    });
                                    setPosicionesSeleccionadas([posicion]);
                                    // Asignar automáticamente los productos de esta posición
                                    setProductosSeleccionados(productosDeEstaPosicion);

                                    console.log('Estados actualizados');
                                  }}
                                  className="w-full mt-2 px-3 py-1.5 bg-secondary text-white rounded hover:bg-secondary/90 transition-colors text-sm font-medium"
                                >
                                  Asignar pago a esta posición
                                </button>
                              )}
                            </div>
                          );
                        })}
                        {detallesPedido.items.filter(item => !item.posicion).length > 0 && (
                          <div className="border border-warning/30 bg-warning/5 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2 bg-warning/20 px-2 py-1 rounded">
                              <span className="text-sm font-semibold text-gray-700">⚠️ Sin posición asignada</span>
                            </div>
                            <p className="text-xs text-gray-600 mb-3 ml-2">
                              Estos productos no tienen posición asignada. Para pago automático por posición, el mesero debe asignar posiciones al crear el pedido.
                            </p>
                            {detallesPedido.items
                              .filter(item => !item.posicion)
                              .map((item, index) => (
                                <div
                                  key={index}
                                  className="flex justify-between items-center py-2 border-b border-gray-100 ml-4"
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
                              ))
                            }
                          </div>
                        )}
                      </div>
                    ) : (
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
                    )}
                  </div>

                  <div className="mb-6 pt-4 border-t-2 border-gray-200">
                    <div className="space-y-2">
                      {(() => {
                        // Calcular subtotal de items PENDIENTES (no facturados)
                        const subtotalPendiente = detallesPedido.items.reduce((sum, item) =>
                          sum + (item.cantidad * item.precio_unitario), 0
                        );
                        const impuestoPendiente = subtotalPendiente * 0.18;
                        const totalPendiente = subtotalPendiente + impuestoPendiente;

                        return (
                          <>
                            <div className="flex justify-between text-gray-600">
                              <span>Subtotal:</span>
                              <span>{formatearMoneda(subtotalPendiente)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                              <span>ITBIS (18%):</span>
                              <span>{formatearMoneda(impuestoPendiente)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-primary pt-2 border-t border-gray-200">
                              <span>Total Pendiente:</span>
                              <span>{formatearMoneda(totalPendiente)}</span>
                            </div>
                          </>
                        );
                      })()}
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

                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="checkbox"
                          id="metodosMultiples"
                          checked={metodosMultiples}
                          onChange={(e) => {
                            setMetodosMultiples(e.target.checked);
                            if (e.target.checked) {
                              setMetodosPagoUnico([{ metodo: 'efectivo', monto: '', referencia: '' }]);
                            }
                          }}
                          className="w-4 h-4 text-primary"
                        />
                        <label htmlFor="metodosMultiples" className="text-sm text-gray-700 cursor-pointer">
                          Pagar con múltiples métodos de pago
                        </label>
                      </div>

                      {!metodosMultiples ? (
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
                      ) : (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="block text-sm font-medium text-gray-700">
                              Métodos de Pago
                            </label>
                            <button
                              type="button"
                              onClick={agregarMetodoPago}
                              className="text-xs text-primary hover:underline font-medium"
                            >
                              + Agregar método
                            </button>
                          </div>

                          {metodosPagoUnico.map((metodo, index) => (
                            <div key={index} className="border border-gray-300 rounded-lg p-3 space-y-2">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-semibold text-gray-600">
                                  Método {index + 1}
                                </span>
                                {metodosPagoUnico.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => eliminarMetodoPago(index)}
                                    className="text-danger hover:bg-danger/10 p-1 rounded text-xs"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>

                              <select
                                value={metodo.metodo}
                                onChange={(e) => actualizarMetodoPago(index, 'metodo', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                              >
                                <option value="efectivo">Efectivo</option>
                                <option value="tarjeta">Tarjeta</option>
                                <option value="transferencia">Transferencia</option>
                              </select>

                              <input
                                type="number"
                                step="0.01"
                                value={metodo.monto}
                                onChange={(e) => actualizarMetodoPago(index, 'monto', e.target.value)}
                                placeholder="Monto (RD$)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                              />

                              {(metodo.metodo === 'tarjeta' || metodo.metodo === 'transferencia') && (
                                <input
                                  type="text"
                                  value={metodo.referencia}
                                  onChange={(e) => actualizarMetodoPago(index, 'referencia', e.target.value)}
                                  placeholder={metodo.metodo === 'tarjeta' ? 'Últimos 4 dígitos / Autorización' : 'Número de referencia'}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
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
                              {pago.posiciones && pago.posiciones.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <p className="text-xs text-gray-500 mb-1">Posiciones:</p>
                                  <div className="flex gap-1 flex-wrap">
                                    {pago.posiciones.map((pos) => (
                                      <span key={pos} className="inline-block w-6 h-6 rounded-full bg-secondary/20 text-secondary text-center leading-6 font-bold text-xs">
                                        {pos}
                                      </span>
                                    ))}
                                  </div>
                                  <div className="space-y-1 mt-2">
                                    {detallesPedido.items
                                      .filter(item => pago.posiciones.includes(item.posicion))
                                      .map((item, idx) => (
                                        <p key={idx} className="text-xs text-gray-600">
                                          • {item.producto_nombre} ({item.cantidad}x) - {formatearMoneda(item.cantidad * item.precio_unitario)}
                                        </p>
                                      ))
                                    }
                                  </div>
                                </div>
                              )}
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

                        <div className="flex items-center gap-2 mb-3">
                          <input
                            type="checkbox"
                            id="metodosMultiplesDividido"
                            checked={usarMetodosMultiplesDividido}
                            onChange={(e) => {
                              setUsarMetodosMultiplesDividido(e.target.checked);
                              if (e.target.checked) {
                                setMetodosPagoDividido([{ metodo: 'efectivo', monto: '', referencia: '' }]);
                              }
                            }}
                            className="w-4 h-4 text-primary"
                          />
                          <label htmlFor="metodosMultiplesDividido" className="text-sm text-gray-700 cursor-pointer">
                            Pagar con múltiples métodos de pago
                          </label>
                        </div>

                        {!usarMetodosMultiplesDividido ? (
                          <>
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
                          </>
                        ) : (
                          <div className="space-y-3 mb-3">
                            <div className="flex justify-between items-center">
                              <label className="block text-sm font-medium text-gray-700">
                                Métodos de Pago
                              </label>
                              <button
                                type="button"
                                onClick={agregarMetodoPagoDividido}
                                className="text-xs text-primary hover:underline font-medium"
                              >
                                + Agregar método
                              </button>
                            </div>

                            {metodosPagoDividido.map((metodo, index) => (
                              <div key={index} className="border border-gray-300 rounded-lg p-3 space-y-2">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-semibold text-gray-600">
                                    Método {index + 1}
                                  </span>
                                  {metodosPagoDividido.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => eliminarMetodoPagoDividido(index)}
                                      className="text-danger hover:bg-danger/10 p-1 rounded text-xs"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>

                                <select
                                  value={metodo.metodo}
                                  onChange={(e) => actualizarMetodoPagoDividido(index, 'metodo', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                >
                                  <option value="efectivo">Efectivo</option>
                                  <option value="tarjeta">Tarjeta</option>
                                  <option value="transferencia">Transferencia</option>
                                </select>

                                <input
                                  type="number"
                                  step="0.01"
                                  value={metodo.monto}
                                  onChange={(e) => actualizarMetodoPagoDividido(index, 'monto', e.target.value)}
                                  placeholder="Monto (RD$)"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                />

                                {(metodo.metodo === 'tarjeta' || metodo.metodo === 'transferencia') && (
                                  <input
                                    type="text"
                                    value={metodo.referencia}
                                    onChange={(e) => actualizarMetodoPagoDividido(index, 'referencia', e.target.value)}
                                    placeholder={metodo.metodo === 'tarjeta' ? 'Últimos 4 dígitos / Autorización' : 'Número de referencia'}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Monto a Pagar
                            </label>
                            <div className="flex gap-2 flex-wrap">
                              {getPosicionesDisponibles().length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMostrarPosiciones(!mostrarPosiciones);
                                    if (!mostrarPosiciones) setMostrarSeleccionProductos(false);
                                  }}
                                  className="text-xs text-secondary hover:underline font-medium"
                                >
                                  {mostrarPosiciones ? 'Cancelar' : 'Por Posición'}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setMostrarSeleccionProductos(!mostrarSeleccionProductos);
                                  if (!mostrarSeleccionProductos) setMostrarPosiciones(false);
                                }}
                                className="text-xs text-primary hover:underline"
                              >
                                {mostrarSeleccionProductos ? 'Cancelar' : 'Por Productos'}
                              </button>
                            </div>
                          </div>

                          {mostrarPosiciones ? (
                            <div className="border border-gray-300 rounded-lg p-3 space-y-2">
                              <p className="text-xs text-gray-600 mb-2">
                                Seleccione las posiciones (sillas) que pagará este cliente:
                              </p>
                              <div className="flex gap-2 flex-wrap mb-3">
                                {getPosicionesDisponibles().map((pos) => (
                                  <button
                                    key={pos}
                                    type="button"
                                    onClick={() => togglePosicionSeleccionada(pos)}
                                    className={`w-14 h-14 rounded-lg font-bold text-lg transition-all ${
                                      posicionesSeleccionadas.includes(pos)
                                        ? 'bg-secondary text-white shadow-lg scale-110'
                                        : 'bg-white border-2 border-gray-300 hover:border-secondary hover:scale-105'
                                    }`}
                                  >
                                    {pos}
                                  </button>
                                ))}
                              </div>
                              <div className="bg-gray-50 rounded p-2 max-h-40 overflow-y-auto">
                                <p className="text-xs font-medium text-gray-700 mb-2">Items incluidos:</p>
                                {posicionesSeleccionadas.length > 0 ? (
                                  <div className="space-y-1">
                                    {detallesPedido.items
                                      .filter(item => posicionesSeleccionadas.includes(item.posicion))
                                      .map((item, idx) => (
                                        <div key={idx} className="text-xs text-gray-600 flex justify-between">
                                          <span>
                                            <span className="inline-block w-6 h-6 rounded-full bg-secondary/20 text-secondary text-center leading-6 font-bold mr-1">
                                              {item.posicion}
                                            </span>
                                            {item.producto_nombre} ({item.cantidad}x)
                                          </span>
                                          <span className="font-semibold">
                                            {formatearMoneda(item.cantidad * item.precio_unitario)}
                                          </span>
                                        </div>
                                      ))
                                    }
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-400 text-center py-2">
                                    No hay posiciones seleccionadas
                                  </p>
                                )}
                              </div>
                              <div className="pt-2 border-t flex justify-between items-center">
                                <span className="text-sm font-medium">Subtotal seleccionado:</span>
                                <span className="text-lg font-bold text-secondary">
                                  {formatearMoneda(calcularMontoPosicionesSeleccionadas())}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={aplicarMontoPosicionesSeleccionadas}
                                className="w-full px-3 py-2 bg-secondary/10 text-secondary rounded hover:bg-secondary/20 transition-colors text-sm font-medium"
                              >
                                Aplicar Monto
                              </button>
                            </div>
                          ) : mostrarSeleccionProductos ? (
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
                      {procesando ? 'Procesando...' :
                        (tipoPago === 'dividido' && calcularTotalPendiente() < parseFloat(detallesPedido.total) - 0.01)
                          ? 'Generar Factura (Pago Parcial)'
                          : 'Generar Factura y Cerrar Mesa'
                      }
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
