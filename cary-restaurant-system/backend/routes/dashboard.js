const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verificarToken } = require('../middleware/auth');


router.get('/stats', verificarToken, async (req, res) => {
  try {
    const { fecha } = req.query;
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0];


    const ventas = await pool.query(`
      SELECT COALESCE(SUM(total), 0) as total_ventas,
             COUNT(*) as num_facturas
      FROM facturas
      WHERE DATE(fecha_hora) = $1
    `, [fechaConsulta]);


    const mesas = await pool.query(`
      SELECT estado, COUNT(*) as cantidad
      FROM mesas
      WHERE activo = TRUE
      GROUP BY estado
    `);


    const pedidos = await pool.query(`
      SELECT COUNT(*) as pedidos_completados
      FROM pedidos
      WHERE DATE(fecha_hora) = $1
        AND estado = 'entregado'
    `, [fechaConsulta]);


    const topProductos = await pool.query(`
      SELECT p.nombre, COUNT(pi.id) as veces_vendido, SUM(pi.subtotal) as total_vendido
      FROM pedido_items pi
      JOIN productos p ON pi.producto_id = p.id
      JOIN pedidos ped ON pi.pedido_id = ped.id
      WHERE DATE(ped.fecha_hora) = $1
      GROUP BY p.id, p.nombre
      ORDER BY veces_vendido DESC
      LIMIT 5
    `, [fechaConsulta]);


    const ventasPorHora = await pool.query(`
      SELECT EXTRACT(HOUR FROM fecha_hora) as hora,
             COUNT(*) as num_facturas,
             SUM(total) as total
      FROM facturas
      WHERE DATE(fecha_hora) = $1
      GROUP BY hora
      ORDER BY hora
    `, [fechaConsulta]);

    const estadoMesas = {};
    mesas.rows.forEach(row => {
      estadoMesas[row.estado] = parseInt(row.cantidad);
    });

    res.json({
      ventas: {
        total: parseFloat(ventas.rows[0].total_ventas),
        num_facturas: parseInt(ventas.rows[0].num_facturas),
        ticket_promedio: ventas.rows[0].num_facturas > 0
          ? parseFloat(ventas.rows[0].total_ventas) / parseInt(ventas.rows[0].num_facturas)
          : 0
      },
      mesas: {
        libre: estadoMesas.libre || 0,
        reservada: estadoMesas.reservada || 0,
        ocupada: estadoMesas.ocupada || 0,
        total: (estadoMesas.libre || 0) + (estadoMesas.reservada || 0) + (estadoMesas.ocupada || 0)
      },
      pedidos: {
        completados: parseInt(pedidos.rows[0].pedidos_completados)
      },
      top_productos: topProductos.rows,
      ventas_por_hora: ventasPorHora.rows,
      fecha: fechaConsulta
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

module.exports = router;
