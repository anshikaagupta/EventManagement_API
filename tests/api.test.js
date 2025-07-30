const request = require('supertest');
const app = require('../server');
const pool = require('../config/database');

describe('Event Management API', () => {
  let testUserId;
  let testEventId;

  beforeAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM registrations');
    await pool.query('DELETE FROM events');
    await pool.query('DELETE FROM users');
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('User Management', () => {
    test('POST /api/users - Create user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('User created successfully');
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.id).toBeDefined();

      testUserId = response.body.user.id;
    });

    test('POST /api/users - Create user with duplicate email should fail', async () => {
      const userData = {
        name: 'Another User',
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(409);

      expect(response.body.error).toBe('Conflict');
      expect(response.body.message).toBe('User with this email already exists');
    });

    test('GET /api/users/:id - Get user details', async () => {
      const response = await request(app)
        .get(`/api/users/${testUserId}`)
        .expect(200);

      expect(response.body.id).toBe(testUserId);
      expect(response.body.name).toBe('Test User');
      expect(response.body.email).toBe('test@example.com');
    });

    test('GET /api/users - List all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body.count).toBeGreaterThan(0);
      expect(Array.isArray(response.body.users)).toBe(true);
    });
  });

  describe('Event Management', () => {
    test('POST /api/events - Create event successfully', async () => {
      const eventData = {
        title: 'Test Event',
        date_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        location: 'Test Location',
        capacity: 100
      };

      const response = await request(app)
        .post('/api/events')
        .send(eventData)
        .expect(201);

      expect(response.body.message).toBe('Event created successfully');
      expect(response.body.event_id).toBeDefined();

      testEventId = response.body.event_id;
    });

    test('POST /api/events - Create event with invalid capacity should fail', async () => {
      const eventData = {
        title: 'Test Event',
        date_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Test Location',
        capacity: 1500 // Exceeds max capacity
      };

      const response = await request(app)
        .post('/api/events')
        .send(eventData)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    test('POST /api/events - Create event with past date should fail', async () => {
      const eventData = {
        title: 'Past Event',
        date_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        location: 'Test Location',
        capacity: 100
      };

      const response = await request(app)
        .post('/api/events')
        .send(eventData)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    test('GET /api/events/:id - Get event details', async () => {
      const response = await request(app)
        .get(`/api/events/${testEventId}`)
        .expect(200);

      expect(response.body.id).toBe(testEventId);
      expect(response.body.title).toBe('Test Event');
      expect(response.body.capacity).toBe(100);
      expect(Array.isArray(response.body.registrations)).toBe(true);
    });

    test('GET /api/events - List upcoming events', async () => {
      const response = await request(app)
        .get('/api/events')
        .expect(200);

      expect(response.body.count).toBeGreaterThan(0);
      expect(Array.isArray(response.body.events)).toBe(true);
    });

    test('GET /api/events/:id/stats - Get event stats', async () => {
      const response = await request(app)
        .get(`/api/events/${testEventId}/stats`)
        .expect(200);

      expect(response.body.event_id).toBe(testEventId);
      expect(response.body.total_registrations).toBeDefined();
      expect(response.body.remaining_capacity).toBeDefined();
      expect(response.body.percentage_used).toBeDefined();
      expect(response.body.capacity).toBe(100);
    });
  });

  describe('Registration Management', () => {
    test('POST /api/registrations - Register for event successfully', async () => {
      const registrationData = {
        user_id: testUserId,
        event_id: testEventId
      };

      const response = await request(app)
        .post('/api/registrations')
        .send(registrationData)
        .expect(201);

      expect(response.body.message).toBe('Registration successful');
      expect(response.body.user_id).toBe(testUserId);
      expect(response.body.event_id).toBe(testEventId);
    });

    test('POST /api/registrations - Duplicate registration should fail', async () => {
      const registrationData = {
        user_id: testUserId,
        event_id: testEventId
      };

      const response = await request(app)
        .post('/api/registrations')
        .send(registrationData)
        .expect(409);

      expect(response.body.error).toBe('Conflict');
      expect(response.body.message).toBe('User is already registered for this event');
    });

    test('GET /api/registrations/status - Check registration status', async () => {
      const response = await request(app)
        .get('/api/registrations/status')
        .query({
          user_id: testUserId,
          event_id: testEventId
        })
        .expect(200);

      expect(response.body.is_registered).toBe(true);
      expect(response.body.registration_date).toBeDefined();
    });

    test('DELETE /api/registrations - Cancel registration successfully', async () => {
      const registrationData = {
        user_id: testUserId,
        event_id: testEventId
      };

      const response = await request(app)
        .delete('/api/registrations')
        .send(registrationData)
        .expect(200);

      expect(response.body.message).toBe('Registration cancelled successfully');
    });

    test('DELETE /api/registrations - Cancel non-existent registration should fail', async () => {
      const registrationData = {
        user_id: testUserId,
        event_id: testEventId
      };

      const response = await request(app)
        .delete('/api/registrations')
        .send(registrationData)
        .expect(404);

      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBe('User is not registered for this event');
    });
  });

  describe('Error Handling', () => {
    test('GET /api/events/999 - Get non-existent event should return 404', async () => {
      const response = await request(app)
        .get('/api/events/999')
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    });

    test('GET /api/users/999 - Get non-existent user should return 404', async () => {
      const response = await request(app)
        .get('/api/users/999')
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    });

    test('POST /api/events - Invalid data should return 400', async () => {
      const invalidData = {
        title: '', // Empty title
        date_time: 'invalid-date',
        location: '',
        capacity: -1
      };

      const response = await request(app)
        .post('/api/events')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('Health Check', () => {
    test('GET /health - Health check endpoint', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.message).toBe('Event Management API is running');
      expect(response.body.timestamp).toBeDefined();
    });
  });
}); 