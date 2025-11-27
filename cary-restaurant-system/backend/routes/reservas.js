const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verificarToken } = require('../middleware/auth');
const { enviarEmailConfirmacion } = require('../services/emailService');

function generarCodigoReserva() {
  const fecha = new Date();
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `RES-${year}${month}${day}-${random}`;
}

router.get('/', verificarToken, async (req, res) => {
  try {
    const { fecha, estado } = req.query;

    let query = `
      SELECT r.*, m.numero as mesa_numero, m.capacidad as mesa_capacidad,
             a.nombre as area_nombre, ap.nombre as area_preferida_nombre
      FROM reservas r
      LEFT JOIN mesas m ON r.mesa_id = m.id
      LEFT JOIN areas a ON m.area_id = a.id
      LEFT JOIN areas ap ON r.area_preferida = ap.id
      WHERE 1=1
    `;
    const params = [];

    if (fecha) {
      params.push(fecha);
      query += ` AND r.fecha = $${params.length}`;
    }

    if (estado) {
      params.push(estado);
      query += ` AND r.estado = $${params.length}`;
    }

    query += ' ORDER BY r.fecha DESC, r.hora DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    res.status(500).json({ error: 'Error al obtener reservas' });
  }
});

router.get('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT r.*, m.numero as mesa_numero, a.nombre as area_nombre,
             ap.nombre as area_preferida_nombre
      FROM reservas r
      LEFT JOIN mesas m ON r.mesa_id = m.id
      LEFT JOIN areas a ON m.area_id = a.id
      LEFT JOIN areas ap ON r.area_preferida = ap.id
      WHERE r.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener reserva:', error);
    res.status(500).json({ error: 'Error al obtener reserva' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      cliente_nombre,
      cliente_telefono,
      cliente_email,
      fecha,
      hora,
      num_personas,
      area_preferida,
      notas
    } = req.body;

    if (!cliente_nombre || !cliente_telefono || !cliente_email || !fecha || !hora || !num_personas) {
      return res.status(400).json({
        error: 'Faltan campos requeridos',
        requeridos: ['cliente_nombre', 'cliente_telefono', 'cliente_email', 'fecha', 'hora', 'num_personas']
      });
    }

    let codigo_reserva = generarCodigoReserva();
    let codigoExiste = await pool.query('SELECT id FROM reservas WHERE codigo_reserva = $1', [codigo_reserva]);
    while (codigoExiste.rows.length > 0) {
      codigo_reserva = generarCodigoReserva();
      codigoExiste = await pool.query('SELECT id FROM reservas WHERE codigo_reserva = $1', [codigo_reserva]);
    }

    const result = await pool.query(`
      INSERT INTO reservas (
        codigo_reserva, cliente_nombre, cliente_telefono, cliente_email,
        fecha, hora, num_personas, mesa_id, area_preferida, notas, estado
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      codigo_reserva,
      cliente_nombre,
      cliente_telefono,
      cliente_email,
      fecha,
      hora,
      num_personas,
      null,
      area_preferida || null,
      notas,
      'pendiente'
    ]);

    res.status(201).json({
      message: 'Reserva creada exitosamente',
      reserva: result.rows[0],
      codigo: codigo_reserva
    });
  } catch (error) {
    console.error('Error al crear reserva:', error);
    res.status(500).json({ error: 'Error al crear reserva' });
  }
});

router.put('/:id', verificarToken, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { estado, mesa_id } = req.body;

    let query = 'UPDATE reservas SET ';
    const params = [];
    const updates = [];

    if (estado) {
      params.push(estado);
      updates.push(`estado = $${params.length}`);
    }

    if (mesa_id !== undefined) {
      params.push(mesa_id);
      updates.push(`mesa_id = $${params.length}`);
    }

    if (updates.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    params.push(id);
    query += updates.join(', ') + ` WHERE id = $${params.length} RETURNING *`;

    const result = await client.query(query, params);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    const reserva = result.rows[0];

    if (estado === 'confirmada' && reserva.mesa_id) {
      await client.query(
        "UPDATE mesas SET estado = 'reservada' WHERE id = $1",
        [reserva.mesa_id]
      );

      const reservaCompleta = await client.query(`
        SELECT r.*, m.numero as mesa_numero, a.nombre as area_nombre
        FROM reservas r
        LEFT JOIN mesas m ON r.mesa_id = m.id
        LEFT JOIN areas a ON m.area_id = a.id
        WHERE r.id = $1
      `, [id]);

      if (reservaCompleta.rows.length > 0) {
        enviarEmailConfirmacion(reservaCompleta.rows[0]).catch(err => {
          console.error('Error al enviar email (no crítico):', err);
        });
      }
    }

    if (estado === 'completada' && reserva.mesa_id) {
      await client.query(
        "UPDATE mesas SET estado = 'ocupada' WHERE id = $1",
        [reserva.mesa_id]
      );
    }

    if (estado === 'cancelada' && reserva.mesa_id) {
      await client.query(
        "UPDATE mesas SET estado = 'libre' WHERE id = $1",
        [reserva.mesa_id]
      );
    }

    await client.query('COMMIT');

    res.json({
      message: 'Reserva actualizada exitosamente',
      reserva: reserva
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar reserva:', error);
    res.status(500).json({ error: 'Error al actualizar reserva' });
  } finally {
    client.release();
  }
});

router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;

    const reservaInfo = await pool.query(
      'SELECT mesa_id FROM reservas WHERE id = $1',
      [id]
    );

    if (reservaInfo.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    await pool.query(
      "UPDATE reservas SET estado = 'cancelada' WHERE id = $1",
      [id]
    );

    if (reservaInfo.rows[0].mesa_id) {
      await pool.query(
        "UPDATE mesas SET estado = 'libre' WHERE id = $1",
        [reservaInfo.rows[0].mesa_id]
      );
    }

    res.json({ message: 'Reserva cancelada exitosamente' });
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    res.status(500).json({ error: 'Error al cancelar reserva' });
  }
});

router.post('/verificar', async (req, res) => {
  try {
    const { codigo_reserva, telefono } = req.body;

    if (!codigo_reserva || !telefono) {
      return res.status(400).json({
        error: 'Se requiere código de reserva y teléfono'
      });
    }

    const result = await pool.query(`
      SELECT r.*, m.numero as mesa_numero, a.nombre as area_nombre
      FROM reservas r
      LEFT JOIN mesas m ON r.mesa_id = m.id
      LEFT JOIN areas a ON m.area_id = a.id
      WHERE r.codigo_reserva = $1 AND r.cliente_telefono = $2
    `, [codigo_reserva, telefono]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'No se encontró ninguna reserva con ese código y teléfono'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al verificar reserva:', error);
    res.status(500).json({ error: 'Error al verificar reserva' });
  }
});

router.post('/cancelar-publica', async (req, res) => {
  try {
    const { codigo_reserva, telefono } = req.body;

    if (!codigo_reserva || !telefono) {
      return res.status(400).json({
        error: 'Se requiere código de reserva y teléfono'
      });
    }

    const reservaInfo = await pool.query(
      'SELECT id, mesa_id, estado FROM reservas WHERE codigo_reserva = $1 AND cliente_telefono = $2',
      [codigo_reserva, telefono]
    );

    if (reservaInfo.rows.length === 0) {
      return res.status(404).json({
        error: 'No se encontró ninguna reserva con ese código y teléfono'
      });
    }

    if (reservaInfo.rows[0].estado === 'cancelada') {
      return res.status(400).json({
        error: 'Esta reserva ya fue cancelada'
      });
    }

    await pool.query(
      "UPDATE reservas SET estado = 'cancelada' WHERE id = $1",
      [reservaInfo.rows[0].id]
    );

    if (reservaInfo.rows[0].mesa_id) {
      await pool.query(
        "UPDATE mesas SET estado = 'libre' WHERE id = $1",
        [reservaInfo.rows[0].mesa_id]
      );
    }

    res.json({ message: 'Reserva cancelada exitosamente' });
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    res.status(500).json({ error: 'Error al cancelar reserva' });
  }
});

// Obtener reserva activa de una mesa
router.get('/mesa/:mesaId/activa', verificarToken, async (req, res) => {
  try {
    const { mesaId } = req.params;

    const result = await pool.query(`
      SELECT r.*, m.numero as mesa_numero, a.nombre as area_nombre
      FROM reservas r
      LEFT JOIN mesas m ON r.mesa_id = m.id
      LEFT JOIN areas a ON m.area_id = a.id
      WHERE r.mesa_id = $1
        AND r.estado IN ('confirmada', 'completada')
      ORDER BY r.fecha DESC, r.hora DESC
      LIMIT 1
    `, [mesaId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No hay reserva activa para esta mesa' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener reserva activa:', error);
    res.status(500).json({ error: 'Error al obtener reserva activa' });
  }
});

module.exports = router;
