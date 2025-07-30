const express = require('express');
const pool = require('../config/database');
const { 
  registrationValidation, 
  handleValidationErrors,
  isEventInPast,
  isEventFull,
  isUserRegistered
} = require('../utils/validators');

const router = express.Router();

// Register for Event
router.post('/', registrationValidation, handleValidationErrors, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { user_id, event_id } = req.body;

    await client.query('BEGIN');

    // Check if user exists
    const userResult = await client.query(
      'SELECT id FROM users WHERE id = $1',
      [user_id]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Check if event exists and get its details
    const eventResult = await client.query(
      'SELECT * FROM events WHERE id = $1',
      [event_id]
    );

    if (eventResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: 'Not Found',
        message: 'Event not found'
      });
    }

    const event = eventResult.rows[0];

    // Business logic validations
    if (isEventInPast(event.date_time)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot register for past events'
      });
    }

    // Check if user is already registered
    const existingRegistration = await client.query(
      'SELECT id FROM registrations WHERE user_id = $1 AND event_id = $2',
      [user_id, event_id]
    );

    if (existingRegistration.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: 'Conflict',
        message: 'User is already registered for this event'
      });
    }

    // Check if event is full
    const registrationCount = await client.query(
      'SELECT COUNT(*) as count FROM registrations WHERE event_id = $1',
      [event_id]
    );

    const currentRegistrations = parseInt(registrationCount.rows[0].count);

    if (isEventFull(currentRegistrations, event.capacity)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Event is full'
      });
    }

    // Register the user
    await client.query(
      'INSERT INTO registrations (user_id, event_id) VALUES ($1, $2)',
      [user_id, event_id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Registration successful',
      user_id,
      event_id,
      event_title: event.title
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error registering for event:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to register for event'
    });
  } finally {
    client.release();
  }
});

// Cancel Registration
router.delete('/', registrationValidation, handleValidationErrors, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { user_id, event_id } = req.body;

    await client.query('BEGIN');

    // Check if user exists
    const userResult = await client.query(
      'SELECT id FROM users WHERE id = $1',
      [user_id]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Check if event exists
    const eventResult = await client.query(
      'SELECT * FROM events WHERE id = $1',
      [event_id]
    );

    if (eventResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: 'Not Found',
        message: 'Event not found'
      });
    }

    // Check if registration exists
    const registrationResult = await client.query(
      'SELECT id FROM registrations WHERE user_id = $1 AND event_id = $2',
      [user_id, event_id]
    );

    if (registrationResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: 'Not Found',
        message: 'User is not registered for this event'
      });
    }

    // Cancel the registration
    await client.query(
      'DELETE FROM registrations WHERE user_id = $1 AND event_id = $2',
      [user_id, event_id]
    );

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Registration cancelled successfully',
      user_id,
      event_id
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error cancelling registration:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to cancel registration'
    });
  } finally {
    client.release();
  }
});

// Get Registration Status
router.get('/status', async (req, res) => {
  try {
    const { user_id, event_id } = req.query;

    if (!user_id || !event_id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Both user_id and event_id are required'
      });
    }

    const result = await pool.query(
      'SELECT * FROM registrations WHERE user_id = $1 AND event_id = $2',
      [user_id, event_id]
    );

    const isRegistered = result.rows.length > 0;

    res.status(200).json({
      user_id: parseInt(user_id),
      event_id: parseInt(event_id),
      is_registered: isRegistered,
      registration_date: isRegistered ? result.rows[0].registered_at : null
    });

  } catch (error) {
    console.error('Error getting registration status:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get registration status'
    });
  }
});

module.exports = router; 