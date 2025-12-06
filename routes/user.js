/**
 * User Routes
 * 
 * Routes for authenticated users.
 * All routes require authentication via Firebase JWT token.
 */

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const userController = require('../controllers/userController');

// All user routes require authentication
router.use(verifyToken);

/**
 * POST /bookings
 * Create a new booking
 * Body: { serviceId, date, location }
 */
router.post('/bookings', userController.createBooking);

/**
 * GET /bookings/me
 * Get current user's bookings
 */
router.get('/bookings/me', userController.getMyBookings);

/**
 * DELETE /bookings/:id
 * Cancel a booking
 */
router.delete('/bookings/:id', userController.deleteBooking);

module.exports = router;

