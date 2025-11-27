import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { facturasAPI } from '../services/api';

function ImprimirFactura() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [factura, setFactura] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarFactura();
  }, [id]);

  const cargarFactura = async () => {
    try {
      setLoading(true);
      const response = await facturasAPI.getById(id);
      setFactura(response.data);
    } catch (error) {
      console.error('Error al cargar factura:', error);
      alert('Error al cargar la factura');
    } finally {
      setLoading(false);
    }
  };

  const formatearMoneda = (valor) => {
    return `RD$${parseFloat(valor).toFixed(2)}`;
  };

  const formatearFecha = (fecha) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const imprimir = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando factura...</p>
      </div>
    );
  }

  if (!factura) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Factura no encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="print:hidden bg-white border-b p-4 flex justify-between items-center">
        <button
          onClick={() => navigate('/facturacion')}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          ← Volver
        </button>
        <button
          onClick={imprimir}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Imprimir Factura
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-8 print:p-0 print:max-w-full">
        <div className="bg-white shadow-lg print:shadow-none p-8 print:p-6">
          <div className="border-b-2 border-primary pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-primary mb-2">
                  Restaurante Cary
                </h1>
                <p className="text-gray-600">Santo Domingo, República Dominicana</p>
                <p className="text-gray-600">RNC: 000-0000000-0</p>
                <p className="text-gray-600">Tel: (809) 000-0000</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">
                  FACTURA
                </p>
                <p className="text-lg font-semibold text-primary mt-2">
                  {factura.numero_factura}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {formatearFecha(factura.fecha_hora)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Cliente:</h3>
              <p className="text-gray-800">{factura.cliente_nombre}</p>
              {factura.tipo_factura === 'dividida' && (
                <p className="text-xs text-primary mt-1">
                  Factura Individual - Pago Dividido (Parte {factura.orden_division})
                </p>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Mesa:</h3>
              <p className="text-gray-800">
                {factura.mesa ? `Mesa ${factura.mesa.numero} - ${factura.mesa.area_nombre}` : 'N/A'}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">Detalle del Consumo:</h3>
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="text-left p-3">Producto</th>
                  <th className="text-center p-3">Cantidad</th>
                  <th className="text-right p-3">Precio Unit.</th>
                  <th className="text-right p-3">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {factura.items && factura.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="p-3">{item.producto_nombre}</td>
                    <td className="text-center p-3">{item.cantidad}</td>
                    <td className="text-right p-3">{formatearMoneda(item.precio_unitario)}</td>
                    <td className="text-right p-3 font-semibold">
                      {formatearMoneda(item.cantidad * item.precio_unitario)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mb-6">
            <div className="w-64">
              <div className="flex justify-between py-2 border-b">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatearMoneda(factura.subtotal)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>ITBIS (18%):</span>
                <span className="font-semibold">{formatearMoneda(factura.impuesto)}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-gray-800">
                <span className="text-xl font-bold">TOTAL:</span>
                <span className="text-xl font-bold text-primary">
                  {formatearMoneda(factura.total)}
                </span>
              </div>
            </div>
          </div>

          {factura.pagos && factura.pagos.length > 0 && (
            <div className="mb-6 border-t pt-6">
              <h3 className="font-semibold text-gray-700 mb-3">
                {factura.pago_dividido ? 'Detalle de Pagos (Cuenta Dividida):' : 'Método de Pago:'}
              </h3>
              <table className="w-full bg-gray-50">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="text-left p-3">Cliente</th>
                    <th className="text-left p-3">Método</th>
                    <th className="text-left p-3">Referencia</th>
                    <th className="text-right p-3">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {factura.pagos.map((pago, index) => (
                    <tr key={index} className="border-b border-gray-300">
                      <td className="p-3">{pago.cliente_nombre}</td>
                      <td className="p-3 capitalize">{pago.metodo_pago}</td>
                      <td className="p-3 text-sm text-gray-600">
                        {pago.referencia || '-'}
                      </td>
                      <td className="text-right p-3 font-semibold">
                        {formatearMoneda(pago.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t-2 border-gray-300 pt-6 mt-8 text-center text-sm text-gray-600">
            <p className="mb-2">¡Gracias por su visita!</p>
            <p>Esta factura es válida sin firma ni sello</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          /* Ocultar todo excepto el contenido de la factura */
          body * {
            visibility: hidden;
          }

          /* Mostrar solo el contenido de impresión */
          .bg-white.shadow-lg,
          .bg-white.shadow-lg * {
            visibility: visible;
          }

          /* Posicionar el contenido en la esquina superior */
          .bg-white.shadow-lg {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }

          /* Ocultar contenedores externos */
          .min-h-screen {
            min-height: auto !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Configuración de página */
          @page {
            size: letter;
            margin: 1cm;
          }

          /* Remover colores de fondo en impresión */
          body {
            background: white !important;
            margin: 0;
            padding: 0;
            height: auto !important;
          }

          /* Asegurar que los bordes se impriman */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
          }

          /* Evitar saltos de página innecesarios */
          table, tbody, tr, td, th {
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}

export default ImprimirFactura;
