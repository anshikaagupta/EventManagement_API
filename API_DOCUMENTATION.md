# Event Management API Documentation

## Overview

The Event Management API provides a complete solution for managing events, users, and registrations. This document provides detailed information about all available endpoints, request/response formats, and business logic.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "details": [ ... ] // Optional validation details
}
```

## Endpoints

### 1. Health Check

**GET** `/health`

Check if the API is running.

**Response:**
```json
{
  "status": "OK",
  "message": "Event Management API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. User Management

#### 2.1 Create User

**POST** `/api/users`

Create a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response (201):**
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

**Validation Rules:**
- `name`: Required, 1-255 characters
- `email`: Required, valid email format, unique

**Error Responses:**
- `400`: Validation error
- `409`: Email already exists

#### 2.2 Get User Details

**GET** `/api/users/:id`

Get details of a specific user.

**Response (200):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `404`: User not found

#### 2.3 List All Users

**GET** `/api/users`

Get a list of all users.

**Response (200):**
```json
{
  "count": 2,
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 2.4 Get User's Event Registrations

**GET** `/api/users/:id/registrations`

Get all events that a user has registered for.

**Response (200):**
```json
{
  "user_id": 1,
  "registrations": [
    {
      "event_id": 1,
      "title": "Tech Conference 2024",
      "date_time": "2024-12-15T10:00:00.000Z",
      "location": "San Francisco",
      "capacity": 500,
      "registered_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `404`: User not found

### 3. Event Management

#### 3.1 Create Event

**POST** `/api/events`

Create a new event.

**Request Body:**
```json
{
  "title": "Tech Conference 2024",
  "date_time": "2024-12-15T10:00:00.000Z",
  "location": "San Francisco",
  "capacity": 500
}
```

**Response (201):**
```json
{
  "message": "Event created successfully",
  "event_id": 1
}
```

**Validation Rules:**
- `title`: Required, 1-255 characters
- `date_time`: Required, ISO 8601 format, must be in the future
- `location`: Required, 1-255 characters
- `capacity`: Required, integer between 1 and 1000

**Error Responses:**
- `400`: Validation error (invalid data or past date)

#### 3.2 Get Event Details

**GET** `/api/events/:id`

Get detailed information about a specific event, including all registered users.

**Response (200):**
```json
{
  "id": 1,
  "title": "Tech Conference 2024",
  "date_time": "2024-12-15T10:00:00.000Z",
  "location": "San Francisco",
  "capacity": 500,
  "created_at": "2024-01-01T00:00:00.000Z",
  "registrations": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "registered_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `404`: Event not found

#### 3.3 List Upcoming Events

**GET** `/api/events`

Get a list of all upcoming events, sorted by date (ascending) then by location (alphabetically).

**Response (200):**
```json
{
  "count": 2,
  "events": [
    {
      "id": 1,
      "title": "Workshop: Web Development",
      "date_time": "2024-01-02T10:00:00.000Z",
      "location": "Chicago",
      "capacity": 50,
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "title": "Tech Conference 2024",
      "date_time": "2024-01-08T10:00:00.000Z",
      "location": "San Francisco",
      "capacity": 500,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 3.4 Get Event Statistics

**GET** `/api/events/:id/stats`

Get statistical information about an event's registrations.

**Response (200):**
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

**Error Responses:**
- `404`: Event not found

### 4. Registration Management

#### 4.1 Register for Event

**POST** `/api/registrations`

Register a user for an event.

**Request Body:**
```json
{
  "user_id": 1,
  "event_id": 1
}
```

**Response (201):**
```json
{
  "message": "Registration successful",
  "user_id": 1,
  "event_id": 1,
  "event_title": "Tech Conference 2024"
}
```

**Business Logic Constraints:**
- User must exist
- Event must exist
- Event must not be in the past
- User must not already be registered for this event
- Event must not be full

**Error Responses:**
- `400`: Bad Request (past event, event full)
- `404`: User or event not found
- `409`: User already registered

#### 4.2 Cancel Registration

**DELETE** `/api/registrations`

Cancel a user's registration for an event.

**Request Body:**
```json
{
  "user_id": 1,
  "event_id": 1
}
```

**Response (200):**
```json
{
  "message": "Registration cancelled successfully",
  "user_id": 1,
  "event_id": 1
}
```

**Error Responses:**
- `404`: User, event, or registration not found

#### 4.3 Check Registration Status

**GET** `/api/registrations/status?user_id=1&event_id=1`

Check if a user is registered for a specific event.

**Response (200):**
```json
{
  "user_id": 1,
  "event_id": 1,
  "is_registered": true,
  "registration_date": "2024-01-01T00:00:00.000Z"
}
```

**Query Parameters:**
- `user_id`: Required, integer
- `event_id`: Required, integer

**Error Responses:**
- `400`: Missing required parameters

## Business Logic Rules

### Event Creation
1. **Capacity Validation**: Must be between 1 and 1000
2. **Date Validation**: Must be in the future
3. **Required Fields**: All fields (title, date_time, location, capacity) are mandatory

### Registration Constraints
1. **No Duplicates**: Users cannot register for the same event twice
2. **Past Events**: Cannot register for events that have already occurred
3. **Capacity Limits**: Cannot register if event is at full capacity
4. **Entity Existence**: Both user and event must exist

### Custom Sorting Algorithm
Upcoming events are sorted using a custom comparator:
1. **Primary Sort**: Date (ascending order)
2. **Secondary Sort**: Location (alphabetical order)

## HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, PUT, DELETE operations |
| 201 | Created | Successful POST operations |
| 400 | Bad Request | Validation errors, business logic violations |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate registration, email already exists |
| 500 | Internal Server Error | Server errors |

## Error Handling

All endpoints return consistent error responses with:
- `error`: Error type/category
- `message`: Human-readable error description
- `details`: Array of validation errors (when applicable)

## Rate Limiting

Currently, no rate limiting is implemented. Consider implementing rate limiting for production use.

## Data Validation

All input data is validated using:
- **Express Validator**: For request body validation
- **Custom Business Logic**: For complex validation rules
- **Database Constraints**: For data integrity

## Database Transactions

Critical operations use database transactions to ensure data consistency:
- User creation
- Event creation
- Registration/cancellation operations

## Performance Considerations

- Database indexes on frequently queried columns
- Efficient queries with proper JOINs
- Connection pooling for database connections
- Custom sorting algorithm for optimal performance 