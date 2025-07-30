const { body, validationResult } = require('express-validator');

// Validation rules for creating events
const createEventValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title is required and must be between 1 and 255 characters'),
  
  body('date_time')
    .isISO8601()
    .withMessage('Date and time must be in ISO format'),
  
  body('location')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Location is required and must be between 1 and 255 characters'),
  
  body('capacity')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Capacity must be a positive integer between 1 and 1000')
];

// Validation rules for user creation
const createUserValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name is required and must be between 1 and 255 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
];

// Validation rules for registration
const registrationValidation = [
  body('user_id')
    .isInt({ min: 1 })
    .withMessage('Valid user ID is required'),
  
  body('event_id')
    .isInt({ min: 1 })
    .withMessage('Valid event ID is required')
];

// Custom validation for business logic
const validateEventCapacity = (capacity) => {
  if (!Number.isInteger(capacity) || capacity <= 0 || capacity > 1000) {
    throw new Error('Capacity must be a positive integer between 1 and 1000');
  }
  return true;
};

const validateEventDate = (dateTime) => {
  const eventDate = new Date(dateTime);
  const now = new Date();
  
  if (isNaN(eventDate.getTime())) {
    throw new Error('Invalid date format');
  }
  
  if (eventDate <= now) {
    throw new Error('Event date must be in the future');
  }
  
  return true;
};

// Check if event is in the past
const isEventInPast = (dateTime) => {
  const eventDate = new Date(dateTime);
  const now = new Date();
  return eventDate <= now;
};

// Check if event is full
const isEventFull = (currentRegistrations, capacity) => {
  return currentRegistrations >= capacity;
};

// Check if user is already registered
const isUserRegistered = (registrations, userId) => {
  return registrations.some(reg => reg.user_id === userId);
};

// Custom comparator for sorting upcoming events
const sortUpcomingEvents = (events) => {
  return events.sort((a, b) => {
    // First sort by date (ascending)
    const dateA = new Date(a.date_time);
    const dateB = new Date(b.date_time);
    
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA - dateB;
    }
    
    // Then sort by location (alphabetically)
    return a.location.localeCompare(b.location);
  });
};

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid input data',
      details: errors.array()
    });
  }
  next();
};

module.exports = {
  createEventValidation,
  createUserValidation,
  registrationValidation,
  validateEventCapacity,
  validateEventDate,
  isEventInPast,
  isEventFull,
  isUserRegistered,
  sortUpcomingEvents,
  handleValidationErrors
}; 