# Event Management API

A robust REST API for event management with user registration capabilities, built with Node.js, Express, and PostgreSQL.

## 🚀 Features

- **Event Management**: Create, view, and manage events with capacity limits
- **User Management**: Register and manage users
- **Registration System**: Register/cancel event registrations with business logic validation
- **Event Statistics**: Get detailed stats about event registrations
- **Custom Sorting**: Intelligent sorting of upcoming events by date and location
- **Comprehensive Validation**: Input validation and business rule enforcement
- **Concurrent Safety**: Database transactions for data consistency

## 📋 Requirements

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd event-management-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=event_management
   DB_USER=postgres
   DB_PASSWORD=your_password
   PORT=3000
   NODE_ENV=development
   ```

4. **Set up the database**
   ```bash
   npm run setup-db
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Health Check
```
GET /health
```

### User Management

#### Create User
```http
POST /api/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Get User Details
```http
GET /api/users/:id
```

#### List All Users
```http
GET /api/users
```

#### Get User's Event Registrations
```http
GET /api/users/:id/registrations
```

### Event Management

#### Create Event
```http
POST /api/events
Content-Type: application/json

{
  "title": "Tech Conference 2024",
  "date_time": "2024-12-15T10:00:00Z",
  "location": "San Francisco",
  "capacity": 500
}
```

**Response:**
```json
{
  "message": "Event created successfully",
  "event_id": 1
}
```

#### Get Event Details
```http
GET /api/events/:id
```

**Response:**
```json
{
  "id": 1,
  "title": "Tech Conference 2024",
  "date_time": "2024-12-15T10:00:00Z",
  "location": "San Francisco",
  "capacity": 500,
  "created_at": "2024-01-01T00:00:00Z",
  "registrations": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "registered_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### List Upcoming Events
```http
GET /api/events
```

**Response:**
```json
{
  "count": 2,
  "events": [
    {
      "id": 1,
      "title": "Workshop: Web Development",
      "date_time": "2024-01-02T10:00:00Z",
      "location": "Chicago",
      "capacity": 50
    },
    {
      "id": 2,
      "title": "Tech Conference 2024",
      "date_time": "2024-01-08T10:00:00Z",
      "location": "San Francisco",
      "capacity": 500
    }
  ]
}
```

#### Get Event Statistics
```http
GET /api/events/:id/stats
```

**Response:**
```json
{
  "event_id": 1,
  "event_title": "Tech Conference 2024",
  "total_registrations": 150,
  "remaining_capacity": 350,
  "percentage_used": 30,
  "capacity": 500
}
```

### Registration Management

#### Register for Event
```http
POST /api/registrations
Content-Type: application/json

{
  "user_id": 1,
  "event_id": 1
}
```

**Response:**
```json
{
  "message": "Registration successful",
  "user_id": 1,
  "event_id": 1,
  "event_title": "Tech Conference 2024"
}
```

#### Cancel Registration
```http
DELETE /api/registrations
Content-Type: application/json

{
  "user_id": 1,
  "event_id": 1
}
```

#### Check Registration Status
```http
GET /api/registrations/status?user_id=1&event_id=1
```

**Response:**
```json
{
  "user_id": 1,
  "event_id": 1,
  "is_registered": true,
  "registration_date": "2024-01-01T00:00:00Z"
}
```

## 🔒 Business Logic Rules

### Event Creation
- Capacity must be between 1 and 1000
- Date must be in the future
- All fields are required

### Registration Constraints
- No duplicate registrations allowed
- Cannot register for past events
- Cannot register if event is full
- User and event must exist

### Custom Sorting
- Upcoming events are sorted first by date (ascending)
- Then by location (alphabetically)

## 🧪 Testing

Run the test suite:
```bash
npm test
```

The tests cover:
- User management operations
- Event creation and retrieval
- Registration and cancellation
- Business logic validation
- Error handling

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Events Table
```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  date_time TIMESTAMP NOT NULL,
  location VARCHAR(255) NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0 AND capacity <= 1000),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Registrations Table
```sql
CREATE TABLE registrations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, event_id)
);
```

## 🚦 HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `409` - Conflict (duplicate registration)
- `500` - Internal Server Error

## 🔧 Development

### Project Structure
```
event-management-api/
├── config/
│   └── database.js          # Database configuration
├── routes/
│   ├── events.js            # Event management routes
│   ├── users.js             # User management routes
│   └── registrations.js     # Registration routes
├── utils/
│   └── validators.js        # Validation utilities
├── scripts/
│   └── setupDatabase.js     # Database setup script
├── tests/
│   └── api.test.js          # API tests
├── server.js                # Main server file
├── package.json
└── README.md
```

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run test suite
- `npm run setup-db` - Set up database tables and sample data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the repository. 