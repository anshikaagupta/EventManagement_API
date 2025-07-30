const pool = require('../config/database');

const setupDatabase = async () => {
  try {
    console.log('🔧 Setting up database...');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create events table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        date_time TIMESTAMP NOT NULL,
        location VARCHAR(255) NOT NULL,
        capacity INTEGER NOT NULL CHECK (capacity > 0 AND capacity <= 1000),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create registrations table (many-to-many relationship)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS registrations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, event_id)
      )
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_events_date_time ON events(date_time);
      CREATE INDEX IF NOT EXISTS idx_events_location ON events(location);
      CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);
      CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);
    `);

    console.log('✅ Database setup completed successfully!');
    
    // Insert sample data
    await insertSampleData();
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

const insertSampleData = async () => {
  try {
    console.log('📝 Inserting sample data...');

    // Insert sample users
    const users = [
      { name: 'John Doe', email: 'john@example.com' },
      { name: 'Jane Smith', email: 'jane@example.com' },
      { name: 'Bob Johnson', email: 'bob@example.com' },
      { name: 'Alice Brown', email: 'alice@example.com' }
    ];

    for (const user of users) {
      await pool.query(
        'INSERT INTO users (name, email) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING',
        [user.name, user.email]
      );
    }

    // Insert sample events
    const events = [
      {
        title: 'Tech Conference 2024',
        date_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        location: 'San Francisco',
        capacity: 500
      },
      {
        title: 'Music Festival',
        date_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        location: 'Los Angeles',
        capacity: 1000
      },
      {
        title: 'Startup Meetup',
        date_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        location: 'New York',
        capacity: 200
      },
      {
        title: 'Workshop: Web Development',
        date_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        location: 'Chicago',
        capacity: 50
      }
    ];

    for (const event of events) {
      await pool.query(
        'INSERT INTO events (title, date_time, location, capacity) VALUES ($1, $2, $3, $4)',
        [event.title, event.date_time, event.location, event.capacity]
      );
    }

    console.log('✅ Sample data inserted successfully!');
  } catch (error) {
    console.error('❌ Sample data insertion failed:', error);
  }
};

setupDatabase(); 