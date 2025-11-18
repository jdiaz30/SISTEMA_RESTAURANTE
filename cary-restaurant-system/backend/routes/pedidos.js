const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verificarToken } = require('../middleware/auth');


router.get('/', verificarToken, async (req, res) => {
  try {
    const { mesa_id, estado } = req.query;

    let query = `
      SELECT p.*, m.numero as mesa_numero,
             u.nombre as mesero_nombre
      FROM pedidos p
      LEFT JOIN mesas m ON p.mesa_id = m.id
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (mesa_id) {
      params.push(mesa_id);
      query += ` AND p.mesa_id = $${params.length}`;
    }

    if (estado) {

      const estados = estado.split(',').map(e => e.trim());
      const placeholders = estados.map((_, i) => `$${params.length + i + 1}`).join(',');
      params.push(...estados);
      query += ` AND p.estado IN (${placeholders})`;
    }

    query += ' ORDER BY p.fecha_hora DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});


router.get('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;

    const pedido = await pool.query('SELECT * FROM pedidos WHERE id = $1', [id]);

    if (pedido.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const items = await pool.query(`
      SELECT pi.*, p.nombre as producto_nombre
      FROM pedido_items pi
      LEFT JOIN productos p ON pi.producto_id = p.id
      WHERE pi.pedido_id = $1
    `, [id]);

    res.json({
      ...pedido.rows[0],
      items: items.rows
    });
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    res.status(500).json({ error: 'Error al obtener pedido' });
  }
});


router.post('/', verificarToken, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { mesa_id, items, notas } = req.body;
    const usuario_id = req.usuario.id;

    if (!mesa_id || !items || items.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Mesa e items son requeridos' });
    }


    const pedidoExistente = await client.query(`
      SELECT id FROM pedidos
      WHERE mesa_id = $1
        AND estado IN ('pendiente', 'preparando', 'listo')
      ORDER BY fecha_hora DESC
      LIMIT 1
    `, [mesa_id]);

    let pedido_id;
    let pedidoResult;

    if (pedidoExistente.rows.length > 0) {

      pedido_id = pedidoExistente.rows[0].id;


      for (const item of items) {
        await client.query(`
          INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario, posicion, notas)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [pedido_id, item.producto_id, item.cantidad, item.precio_unitario, item.posicion, item.notas]);
      }


      const itemsResult = await client.query(`
        SELECT SUM(cantidad * precio_unitario) as subtotal
        FROM pedido_items
        WHERE pedido_id = $1
      `, [pedido_id]);

      const subtotal = parseFloat(itemsResult.rows[0].subtotal || 0);
      const impuesto = subtotal * 0.18;
      const total = subtotal + impuesto;


      pedidoResult = await client.query(`
        UPDATE pedidos
        SET subtotal = $1, impuesto = $2, total = $3
        WHERE id = $4
        RETURNING *
      `, [subtotal, impuesto, total, pedido_id]);

    } else {

      let subtotal = 0;
      items.forEach(item => {
        subtotal += item.cantidad * item.precio_unitario;
      });

      const impuesto = subtotal * 0.18; // 18% ITBIS
      const total = subtotal + impuesto;

      pedidoResult = await client.query(`
        INSERT INTO pedidos (mesa_id, usuario_id, subtotal, impuesto, total, notas)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [mesa_id, usuario_id, subtotal, impuesto, total, notas]);

      pedido_id = pedidoResult.rows[0].id;


      for (const item of items) {
        await client.query(`
          INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario, posicion, notas)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [pedido_id, item.producto_id, item.cantidad, item.precio_unitario, item.posicion, item.notas]);
      }


      await client.query("UPDATE mesas SET estado = 'ocupada' WHERE id = $1", [mesa_id]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: pedidoExistente.rows.length > 0
        ? 'Items agregados al pedido existente'
        : 'Pedido creado exitosamente',
      pedido: pedidoResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear/actualizar pedido:', error);
    res.status(500).json({ error: 'Error al crear/actualizar pedido' });
  } finally {
    client.release();
  }
});


router.patch('/:id/estado', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const result = await pool.query(
      'UPDATE pedidos SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json({
      message: 'Estado actualizado exitosamente',
      pedido: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});


router.delete('/:pedidoId/items/:itemId', verificarToken, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { pedidoId, itemId } = req.params;


    const itemResult = await client.query(
      'SELECT * FROM pedido_items WHERE id = $1 AND pedido_id = $2',
      [itemId, pedidoId]
    );

    if (itemResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Item no encontrado en el pedido' });
    }


    await client.query('DELETE FROM pedido_items WHERE id = $1', [itemId]);


    const itemsRestantes = await client.query(
      'SELECT COUNT(*) as count FROM pedido_items WHERE pedido_id = $1',
      [pedidoId]
    );

    if (parseInt(itemsRestantes.rows[0].count) === 0) {

      const pedido = await client.query('SELECT mesa_id FROM pedidos WHERE id = $1', [pedidoId]);
      const mesa_id = pedido.rows[0].mesa_id;

      await client.query('DELETE FROM pedidos WHERE id = $1', [pedidoId]);
      await client.query("UPDATE mesas SET estado = 'libre' WHERE id = $1", [mesa_id]);

      await client.query('COMMIT');
      return res.json({
        message: 'Último item eliminado. Pedido cancelado y mesa liberada.',
        pedidoEliminado: true
      });
    }


    const totalesResult = await client.query(`
      SELECT SUM(cantidad * precio_unitario) as subtotal
      FROM pedido_items
      WHERE pedido_id = $1
    `, [pedidoId]);

    const subtotal = parseFloat(totalesResult.rows[0].subtotal || 0);
    const impuesto = subtotal * 0.18;
    const total = subtotal + impuesto;


    await client.query(`
      UPDATE pedidos
      SET subtotal = $1, impuesto = $2, total = $3
      WHERE id = $4
    `, [subtotal, impuesto, total, pedidoId]);

    await client.query('COMMIT');

    res.json({
      message: 'Item eliminado y totales actualizados',
      pedidoEliminado: false
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar item:', error);
    res.status(500).json({ error: 'Error al eliminar item del pedido' });
  } finally {
    client.release();
  }
});

module.exports = router;
