const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verificarToken } = require('../middleware/auth');

router.get('/', verificarToken, async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta } = req.query;

    let query = 'SELECT * FROM facturas WHERE 1=1';
    const params = [];

    if (fecha_desde) {
      params.push(fecha_desde);
      query += ` AND DATE(fecha_hora) >= $${params.length}`;
    }

    if (fecha_hasta) {
      params.push(fecha_hasta);
      query += ` AND DATE(fecha_hora) <= $${params.length}`;
    }

    query += ' ORDER BY fecha_hora DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    res.status(500).json({ error: 'Error al obtener facturas' });
  }
});

router.get('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;

    const factura = await pool.query('SELECT * FROM facturas WHERE id = $1', [id]);

    if (factura.rows.length === 0) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    const pagos = await pool.query(
      'SELECT * FROM factura_pagos WHERE factura_id = $1 ORDER BY id',
      [id]
    );

    // Obtener items desde factura_items (nueva tabla)
    // Si no existen, buscar en pedido_items (compatibilidad con facturas antiguas)
    let items = await pool.query(`
      SELECT fi.*, p.nombre as producto_nombre
      FROM factura_items fi
      LEFT JOIN productos p ON fi.producto_id = p.id
      WHERE fi.factura_id = $1
      ORDER BY fi.id
    `, [id]);

    // Compatibilidad con facturas antiguas (antes de la migración)
    if (items.rows.length === 0) {
      const pedido_id = factura.rows[0].pedido_id;
      items = await pool.query(`
        SELECT pi.*, p.nombre as producto_nombre
        FROM pedido_items pi
        LEFT JOIN productos p ON pi.producto_id = p.id
        WHERE pi.pedido_id = $1
      `, [pedido_id]);
    }

    // Obtener información de la mesa
    const mesa = await pool.query(`
      SELECT m.numero, a.nombre as area_nombre
      FROM mesas m
      LEFT JOIN areas a ON m.area_id = a.id
      WHERE m.id = $1
    `, [factura.rows[0].mesa_id]);

    res.json({
      ...factura.rows[0],
      pagos: pagos.rows,
      items: items.rows,
      mesa: mesa.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener factura:', error);
    res.status(500).json({ error: 'Error al obtener factura' });
  }
});


router.post('/', verificarToken, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { pedido_id, mesa_id, pagos } = req.body;
    const usuario_id = req.usuario.id;

    console.log('🔵 INICIO - Crear factura');
    console.log('Pedido ID:', pedido_id);
    console.log('Mesa ID:', mesa_id);
    console.log('Cantidad de pagos recibidos:', pagos?.length);

    // Validaciones básicas
    if (!pagos || !Array.isArray(pagos) || pagos.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Debe proporcionar al menos un pago' });
    }

    for (const pago of pagos) {
      if (!pago.cliente_nombre || !pago.metodo_pago || !pago.monto) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Cada pago debe tener cliente_nombre, metodo_pago y monto' });
      }
    }

    // Obtener pedido con sus items
    const pedido = await client.query('SELECT * FROM pedidos WHERE id = $1', [pedido_id]);

    if (pedido.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const pedidoData = pedido.rows[0];

    // Obtener items del pedido (SOLO los NO facturados para pago parcial)
    const itemsResult = await client.query(`
      SELECT pi.*, p.nombre as producto_nombre
      FROM pedido_items pi
      LEFT JOIN productos p ON pi.producto_id = p.id
      WHERE pi.pedido_id = $1 AND pi.facturado = FALSE
    `, [pedido_id]);

    const pedidoItems = itemsResult.rows;

    console.log('🟢 Items NO facturados encontrados:', pedidoItems.length);
    if (pedidoItems.length > 0) {
      console.log('Items:', pedidoItems.map(i => ({id: i.id, nombre: i.producto_nombre, posicion: i.posicion, precio: i.precio_unitario})));
    }

    // Si no hay items pendientes, significa que ya todo fue facturado
    if (pedidoItems.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Todos los items de este pedido ya han sido facturados',
        pedido_cerrado: true
      });
    }

    // Calcular el total de items que REALMENTE se van a facturar en esta operación
    // (no todos los pendientes, sino solo los incluidos en los pagos)
    let itemsAFacturar = [];

    // Identificar qué items se van a facturar basándose en los pagos
    for (const pago of pagos) {
      if (pago.productos && Array.isArray(pago.productos)) {
        // Si especifica productos, agregar esos items
        const itemsDeEstePago = pedidoItems.filter(item => pago.productos.includes(item.id));
        itemsAFacturar.push(...itemsDeEstePago);
      } else if (pago.posiciones && Array.isArray(pago.posiciones)) {
        // Si especifica posiciones, agregar items de esas posiciones
        const itemsDeEstePago = pedidoItems.filter(item => pago.posiciones.includes(item.posicion));
        itemsAFacturar.push(...itemsDeEstePago);
      } else {
        // Si no especifica ni productos ni posiciones, facturar TODO
        itemsAFacturar = [...pedidoItems];
        break;
      }
    }

    // Eliminar duplicados (por si un item aparece en múltiples pagos)
    itemsAFacturar = itemsAFacturar.filter((item, index, self) =>
      index === self.findIndex(i => i.id === item.id)
    );

    // Calcular total de items que SE VAN A FACTURAR
    const totalAFacturar = itemsAFacturar.reduce((sum, item) =>
      sum + (item.cantidad * parseFloat(item.precio_unitario)), 0
    );
    const impuestoAFacturar = totalAFacturar * 0.18;
    const totalConImpuesto = totalAFacturar + impuestoAFacturar;

    // Validar suma de pagos contra el total A FACTURAR (no contra todos los pendientes)
    const sumaPagos = pagos.reduce((sum, pago) => sum + parseFloat(pago.monto), 0);

    console.log('===== VALIDACIÓN FACTURACIÓN =====');
    console.log('Items pendientes totales:', pedidoItems.length);
    console.log('Items a facturar ahora:', itemsAFacturar.length);
    console.log('Items a facturar:', itemsAFacturar.map(i => ({id: i.id, nombre: i.producto_nombre, posicion: i.posicion})));
    console.log('Total a facturar (sin ITBIS):', totalAFacturar);
    console.log('ITBIS:', impuestoAFacturar);
    console.log('Total con ITBIS:', totalConImpuesto);
    console.log('Suma de pagos:', sumaPagos);
    console.log('Diferencia:', Math.abs(sumaPagos - totalConImpuesto));
    console.log('==================================');

    if (Math.abs(sumaPagos - totalConImpuesto) > 0.01) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'La suma de los pagos no coincide con el total de items a facturar',
        suma_pagos: sumaPagos,
        total_a_facturar: totalConImpuesto,
        items_a_facturar: itemsAFacturar.length
      });
    }

    // Determinar si es pago dividido:
    // 1. Si hay más de un pago
    // 2. O si hay UN pago pero con posiciones/productos específicos (pago parcial)
    const esPagoDividido = pagos.length > 1 ||
                           (pagos.length === 1 && (pagos[0].posiciones || pagos[0].productos));

    const facturas = [];

    if (esPagoDividido) {
      // ============================================
      // FLUJO PAGO DIVIDIDO: Múltiples facturas
      // ============================================

      // Obtener contador base para facturas
      const countResult = await client.query('SELECT COUNT(*) as count FROM facturas');
      const baseCount = parseInt(countResult.rows[0].count) + 1;
      const baseNumero = `F-${baseCount.toString().padStart(4, '0')}-2025`;

      let facturaPrincipalId = null;

      for (let i = 0; i < pagos.length; i++) {
        const pago = pagos[i];
        const letraOrden = String.fromCharCode(65 + i); // A, B, C, etc.
        const numero_factura = `${baseNumero}-${letraOrden}`;

        // Calcular items para esta factura
        let itemsFactura = [];
        let subtotalFactura = 0;

        // Si hay productos específicos asignados
        if (pago.productos && Array.isArray(pago.productos) && pago.productos.length > 0) {
          itemsFactura = pedidoItems.filter(item => pago.productos.includes(item.id));
        }
        // Si hay posiciones específicas asignadas
        else if (pago.posiciones && Array.isArray(pago.posiciones) && pago.posiciones.length > 0) {
          itemsFactura = pedidoItems.filter(item => pago.posiciones.includes(item.posicion));
        }
        // Si no hay asignación específica, dividir proporcionalmente al monto
        else {
          // Calcular proporción del pago respecto al total
          const proporcion = parseFloat(pago.monto) / parseFloat(pedidoData.total);

          // Asignar todos los items pero ajustados proporcionalmente
          itemsFactura = pedidoItems.map(item => ({
            ...item,
            cantidad_original: item.cantidad,
            // Mantener cantidad pero ajustar el precio para la proporción
            precio_ajustado: item.precio_unitario * proporcion * pedidoItems.length
          }));
        }

        // Calcular subtotal e impuesto para esta factura
        if (pago.productos || pago.posiciones) {
          subtotalFactura = itemsFactura.reduce((sum, item) =>
            sum + (item.cantidad * item.precio_unitario), 0
          );
        } else {
          // Si es proporción, usar el monto dividido entre 1.18 (para sacar el subtotal)
          subtotalFactura = parseFloat(pago.monto) / 1.18;
        }

        const impuestoFactura = subtotalFactura * 0.18;
        const totalFactura = subtotalFactura + impuestoFactura;

        // Validar que el total calculado coincida con el monto del pago
        if (Math.abs(totalFactura - parseFloat(pago.monto)) > 0.01) {
          // Ajustar para evitar errores de redondeo
          subtotalFactura = parseFloat(pago.monto) / 1.18;
          const impuestoRecalculado = parseFloat(pago.monto) - subtotalFactura;
        }

        // Crear factura individual
        const facturaResult = await client.query(`
          INSERT INTO facturas (
            numero_factura, pedido_id, mesa_id, cliente_nombre,
            subtotal, impuesto, total, metodo_pago, usuario_id,
            pago_dividido, factura_principal_id, orden_division, tipo_factura
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *
        `, [
          numero_factura,
          pedido_id,
          mesa_id,
          pago.cliente_nombre,
          parseFloat(pago.monto) / 1.18, // subtotal
          parseFloat(pago.monto) - (parseFloat(pago.monto) / 1.18), // impuesto
          parseFloat(pago.monto), // total
          pago.metodo_pago,
          usuario_id,
          true, // pago_dividido
          facturaPrincipalId, // primera factura es null, resto referencian a la primera
          i + 1, // orden_division
          'dividida' // tipo_factura
        ]);

        const factura_id = facturaResult.rows[0].id;

        // Si es la primera factura, guardar como principal
        if (i === 0) {
          facturaPrincipalId = factura_id;
        }

        // Insertar items específicos de esta factura Y marcarlos como facturados
        for (const item of itemsFactura) {
          await client.query(`
            INSERT INTO factura_items (
              factura_id, producto_id, producto_nombre,
              cantidad, precio_unitario, posicion
            )
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            factura_id,
            item.producto_id,
            item.producto_nombre,
            item.cantidad,
            item.precio_unitario,
            item.posicion
          ]);

          // Marcar el item del pedido como facturado
          await client.query(`
            UPDATE pedido_items
            SET facturado = TRUE, factura_id = $1, fecha_facturacion = NOW()
            WHERE id = $2
          `, [factura_id, item.id]);
        }

        // Insertar registro de pago
        await client.query(`
          INSERT INTO factura_pagos (
            factura_id, cliente_nombre, metodo_pago, monto, referencia,
            productos_asignados, posiciones_asignadas
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          factura_id,
          pago.cliente_nombre,
          pago.metodo_pago,
          parseFloat(pago.monto),
          pago.referencia || null,
          pago.productos ? JSON.stringify(pago.productos) : null,
          pago.posiciones ? `{${pago.posiciones.join(',')}}` : null
        ]);

        facturas.push(facturaResult.rows[0]);
      }

    } else {
      // ============================================
      // FLUJO PAGO ÚNICO: Una sola factura
      // ============================================

      const pago = pagos[0];
      const countResult = await client.query('SELECT COUNT(*) as count FROM facturas');
      const count = parseInt(countResult.rows[0].count) + 1;
      const numero_factura = `F-${count.toString().padStart(4, '0')}-2025`;

      const facturaResult = await client.query(`
        INSERT INTO facturas (
          numero_factura, pedido_id, mesa_id, cliente_nombre,
          subtotal, impuesto, total, metodo_pago, usuario_id,
          pago_dividido, tipo_factura
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        numero_factura,
        pedido_id,
        mesa_id,
        pago.cliente_nombre,
        pedidoData.subtotal,
        pedidoData.impuesto,
        pedidoData.total,
        pago.metodo_pago,
        usuario_id,
        false, // pago_dividido
        'unica' // tipo_factura
      ]);

      const factura_id = facturaResult.rows[0].id;

      // Insertar todos los items del pedido en esta factura
      for (const item of pedidoItems) {
        await client.query(`
          INSERT INTO factura_items (
            factura_id, producto_id, producto_nombre,
            cantidad, precio_unitario, posicion
          )
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          factura_id,
          item.producto_id,
          item.producto_nombre,
          item.cantidad,
          item.precio_unitario,
          item.posicion
        ]);
      }

      // Insertar registro de pago
      await client.query(`
        INSERT INTO factura_pagos (
          factura_id, cliente_nombre, metodo_pago, monto, referencia
        )
        VALUES ($1, $2, $3, $4, $5)
      `, [
        factura_id,
        pago.cliente_nombre,
        pago.metodo_pago,
        parseFloat(pago.monto),
        pago.referencia || null
      ]);

      // Marcar items del pago único como facturados
      for (const item of pedidoItems) {
        await client.query(`
          UPDATE pedido_items
          SET facturado = TRUE, factura_id = $1, fecha_facturacion = NOW()
          WHERE id = $2
        `, [factura_id, item.id]);
      }

      facturas.push(facturaResult.rows[0]);
    }

    // Verificar si TODOS los items del pedido están facturados
    const itemsPendientes = await client.query(`
      SELECT COUNT(*) as count
      FROM pedido_items
      WHERE pedido_id = $1 AND facturado = FALSE
    `, [pedido_id]);

    const todoFacturado = parseInt(itemsPendientes.rows[0].count) === 0;

    // Solo cerrar pedido y liberar mesa si TODO está facturado
    if (todoFacturado) {
      await client.query("UPDATE pedidos SET estado = 'entregado' WHERE id = $1", [pedido_id]);

      if (mesa_id) {
        await client.query("UPDATE mesas SET estado = 'libre' WHERE id = $1", [mesa_id]);
      }
    } else {
      // Si hay items pendientes, el pedido sigue activo
      // No se cierra la mesa, puede seguir consumiendo
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: esPagoDividido
        ? `${facturas.length} facturas creadas exitosamente`
        : 'Factura creada exitosamente',
      facturas: facturas,
      pago_dividido: esPagoDividido,
      cantidad_facturas: facturas.length,
      mesa_cerrada: todoFacturado,
      items_pendientes: !todoFacturado
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear factura:', error);
    res.status(500).json({ error: 'Error al crear factura', detalle: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;
