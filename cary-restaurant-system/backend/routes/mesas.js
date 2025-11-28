const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verificarToken } = require('../middleware/auth');

router.get('/', verificarToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.id, m.numero, m.capacidad, m.estado,
             a.nombre as area, a.id as area_id
      FROM mesas m
      LEFT JOIN areas a ON m.area_id = a.id
      WHERE m.activo = TRUE
      ORDER BY m.numero
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener mesas:', error);
    res.status(500).json({ error: 'Error al obtener mesas' });
  }
});

router.get('/area/:areaId', verificarToken, async (req, res) => {
  try {
    const { areaId } = req.params;

    const result = await pool.query(`
      SELECT m.id, m.numero, m.capacidad, m.estado,
             a.nombre as area
      FROM mesas m
      LEFT JOIN areas a ON m.area_id = a.id
      WHERE m.area_id = $1 AND m.activo = TRUE
      ORDER BY m.numero
    `, [areaId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener mesas por área:', error);
    res.status(500).json({ error: 'Error al obtener mesas' });
  }
});

router.patch('/:id/estado', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['libre', 'reservada', 'ocupada'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const result = await pool.query(
      'UPDATE mesas SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }

    res.json({
      message: 'Estado actualizado correctamente',
      mesa: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

router.get('/areas', verificarToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, COUNT(m.id) as num_mesas
      FROM areas a
      LEFT JOIN mesas m ON a.id = m.area_id AND m.activo = TRUE
      WHERE a.activo = TRUE
      GROUP BY a.id
      ORDER BY a.id
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener áreas:', error);
    res.status(500).json({ error: 'Error al obtener áreas' });
  }
});

router.get('/ocupadas-con-pedidos', verificarToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        m.id as mesa_id,
        m.numero as mesa_numero,
        a.nombre as area_nombre,
        p.id as pedido_id,
        p.estado as pedido_estado,
        p.fecha_hora as pedido_fecha,
        -- Calcular subtotal e impuesto SOLO de items NO facturados
        COALESCE(SUM(CASE WHEN pi.facturado = FALSE THEN pi.cantidad * pi.precio_unitario ELSE 0 END), 0) as subtotal_pendiente,
        COALESCE(SUM(CASE WHEN pi.facturado = FALSE THEN pi.cantidad * pi.precio_unitario ELSE 0 END) * 0.18, 0) as impuesto_pendiente,
        COALESCE(SUM(CASE WHEN pi.facturado = FALSE THEN pi.cantidad * pi.precio_unitario ELSE 0 END) * 1.18, 0) as total
      FROM mesas m
      INNER JOIN pedidos p ON m.id = p.mesa_id
      LEFT JOIN areas a ON m.area_id = a.id
      LEFT JOIN pedido_items pi ON p.id = pi.pedido_id
      WHERE m.estado = 'ocupada'
        AND p.estado IN ('pendiente', 'preparando', 'listo')
        AND m.activo = TRUE
      GROUP BY m.id, m.numero, a.nombre, p.id, p.estado, p.fecha_hora
      ORDER BY m.numero
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener mesas ocupadas:', error);
    res.status(500).json({ error: 'Error al obtener mesas ocupadas' });
  }
});

module.exports = router;
