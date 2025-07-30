const express = require('express');
const pool = require('../config/database');
const { 
  createEventValidation, 
  handleValidationErrors,
  validateEventCapacity,
  validateEventDate,
  sortUpcomingEvents
} = require('../utils/validators');

const router = express.Router();

// Create Event
router.post('/', createEventValidation, handleValidationErrors, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { title, date_time, location, capacity } = req.body;

    // Additional business logic validation
    try {
      validateEventCapacity(capacity);
      validateEventDate(date_time);
    } catch (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }

    await client.query('BEGIN');

    const result = await client.query(
      'INSERT INTO events (title, date_time, location, capacity) VALUES ($1, $2, $3, $4) RETURNING id',
      [title, date_time, location, capacity]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Event created successfully',
      event_id: result.rows[0].id
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating event:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create event'
    });
  } finally {
    client.release();
  }
});

// Get Event Details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const eventResult = await pool.query(
      'SELECT * FROM events WHERE id = $1',
      [id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Event not found'
      });
    }

    const event = eventResult.rows[0];

    // Get registered users for this event
    const registrationsResult = await pool.query(`
      SELECT u.id, u.name, u.email, r.registered_at
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      WHERE r.event_id = $1
      ORDER BY r.registered_at ASC
    `, [id]);

    const response = {
      ...event,
      registrations: registrationsResult.rows
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting event details:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get event details'
    });
  }
});

// List Upcoming Events
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    
    const result = await pool.query(`
      SELECT * FROM events 
      WHERE date_time > $1 
      ORDER BY date_time ASC, location ASC
    `, [now]);

    const upcomingEvents = sortUpcomingEvents(result.rows);

    res.status(200).json({
      count: upcomingEvents.length,
      events: upcomingEvents
    });

  } catch (error) {
    console.error('Error listing upcoming events:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to list upcoming events'
    });
  }
});

// Event Stats
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    // Get event details
    const eventResult = await pool.query(
      'SELECT * FROM events WHERE id = $1',
      [id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Event not found'
      });
    }

    const event = eventResult.rows[0];

    // Get registration count
    const registrationResult = await pool.query(
      'SELECT COUNT(*) as total_registrations FROM registrations WHERE event_id = $1',
      [id]
    );

    const totalRegistrations = parseInt(registrationResult.rows[0].total_registrations);
    const remainingCapacity = event.capacity - totalRegistrations;
    const percentageUsed = Math.round((totalRegistrations / event.capacity) * 100);

    const stats = {
      event_id: event.id,
      event_title: event.title,
      total_registrations: totalRegistrations,
      remaining_capacity: remainingCapacity,
      percentage_used: percentageUsed,
      capacity: event.capacity
    };

    res.status(200).json(stats);

  } catch (error) {
    console.error('Error getting event stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get event stats'
    });
  }
});

module.exports = router; 