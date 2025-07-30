const express = require('express');
const pool = require('../config/database');
const { createUserValidation, handleValidationErrors } = require('../utils/validators');

const router = express.Router();

// Create User
router.post('/', createUserValidation, handleValidationErrors, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { name, email } = req.body;

    await client.query('BEGIN');

    const result = await client.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email',
      [name, email]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'User created successfully',
      user: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        error: 'Conflict',
        message: 'User with this email already exists'
      });
    }

    console.error('Error creating user:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create user'
    });
  } finally {
    client.release();
  }
});

// Get User Details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error('Error getting user details:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user details'
    });
  }
});

// List All Users
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users ORDER BY created_at DESC'
    );

    res.status(200).json({
      count: result.rows.length,
      users: result.rows
    });

  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to list users'
    });
  }
});

// Get User's Event Registrations
router.get('/:id/registrations', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const userResult = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Get user's registrations with event details
    const result = await pool.query(`
      SELECT 
        e.id as event_id,
        e.title,
        e.date_time,
        e.location,
        e.capacity,
        r.registered_at
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.user_id = $1
      ORDER BY e.date_time ASC
    `, [id]);

    res.status(200).json({
      user_id: id,
      registrations: result.rows
    });

  } catch (error) {
    console.error('Error getting user registrations:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user registrations'
    });
  }
});

module.exports = router; 