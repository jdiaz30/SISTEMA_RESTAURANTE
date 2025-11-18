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


    const pedido_id = factura.rows[0].pedido_id;
    const items = await pool.query(`
      SELECT pi.*, p.nombre as producto_nombre
      FROM pedido_items pi
      LEFT JOIN productos p ON pi.producto_id = p.id
      WHERE pi.pedido_id = $1
    `, [pedido_id]);


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


    const pedido = await client.query('SELECT * FROM pedidos WHERE id = $1', [pedido_id]);

    if (pedido.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const { subtotal, impuesto, total } = pedido.rows[0];


    const sumaPagos = pagos.reduce((sum, pago) => sum + parseFloat(pago.monto), 0);
    if (Math.abs(sumaPagos - parseFloat(total)) > 0.01) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'La suma de los pagos debe ser igual al total de la factura',
        suma_pagos: sumaPagos,
        total_factura: total
      });
    }


    const countResult = await client.query('SELECT COUNT(*) as count FROM facturas');
    const count = parseInt(countResult.rows[0].count) + 1;
    const numero_factura = `F-${count.toString().padStart(4, '0')}-2025`;

    const pago_dividido = pagos.length > 1;


    const primer_pago = pagos[0];


    const facturaResult = await client.query(`
      INSERT INTO facturas (
        numero_factura, pedido_id, mesa_id, cliente_nombre,
        subtotal, impuesto, total, metodo_pago, usuario_id, pago_dividido
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      numero_factura,
      pedido_id,
      mesa_id,
      pago_dividido ? 'PAGO DIVIDIDO' : primer_pago.cliente_nombre,
      subtotal,
      impuesto,
      total,
      pago_dividido ? 'multiple' : primer_pago.metodo_pago,
      usuario_id,
      pago_dividido
    ]);

    const factura_id = facturaResult.rows[0].id;


    for (const pago of pagos) {
      await client.query(`
        INSERT INTO factura_pagos (factura_id, cliente_nombre, metodo_pago, monto, referencia)
        VALUES ($1, $2, $3, $4, $5)
      `, [factura_id, pago.cliente_nombre, pago.metodo_pago, parseFloat(pago.monto), pago.referencia || null]);
    }


    await client.query("UPDATE pedidos SET estado = 'entregado' WHERE id = $1", [pedido_id]);


    if (mesa_id) {
      await client.query("UPDATE mesas SET estado = 'libre' WHERE id = $1", [mesa_id]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Factura creada exitosamente',
      factura: facturaResult.rows[0],
      pagos: pagos.length
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear factura:', error);
    res.status(500).json({ error: 'Error al crear factura' });
  } finally {
    client.release();
  }
});

module.exports = router;
