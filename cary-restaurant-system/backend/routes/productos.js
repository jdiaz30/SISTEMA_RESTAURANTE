const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verificarToken, verificarRol } = require('../middleware/auth');


router.get('/', async (req, res) => {
  try {
    const { categoria_id, disponible } = req.query;

    let query = `
      SELECT p.*, c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (categoria_id) {
      params.push(categoria_id);
      query += ` AND p.categoria_id = $${params.length}`;
    }

    if (disponible !== undefined) {
      params.push(disponible === 'true');
      query += ` AND p.disponible = $${params.length}`;
    }

    query += ' ORDER BY c.orden, p.nombre';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});


router.get('/categorias', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, COUNT(p.id) as num_productos
      FROM categorias c
      LEFT JOIN productos p ON c.id = p.categoria_id
      WHERE c.activo = TRUE
      GROUP BY c.id
      ORDER BY c.orden
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});


router.post('/', verificarToken, verificarRol('admin'), async (req, res) => {
  try {
    const { nombre, descripcion, precio, categoria_id } = req.body;

    if (!nombre || !precio) {
      return res.status(400).json({ error: 'Nombre y precio son requeridos' });
    }

    const result = await pool.query(`
      INSERT INTO productos (nombre, descripcion, precio, categoria_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [nombre, descripcion, precio, categoria_id]);

    res.status(201).json({
      message: 'Producto creado exitosamente',
      producto: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});


router.put('/:id', verificarToken, verificarRol('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, disponible } = req.body;

    const result = await pool.query(`
      UPDATE productos
      SET nombre = COALESCE($1, nombre),
          descripcion = COALESCE($2, descripcion),
          precio = COALESCE($3, precio),
          disponible = COALESCE($4, disponible)
      WHERE id = $5
      RETURNING *
    `, [nombre, descripcion, precio, disponible, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({
      message: 'Producto actualizado exitosamente',
      producto: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

module.exports = router;
