/**
 * Public Routes
 * 
 * Routes that don't require authentication.
 * Accessible to all users (authenticated or not).
 */

const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

/**
 * POST /register
 * Register/Create user profile after Firebase authentication
 * Requires: Authorization header with Firebase JWT token
 * Body: { name (required), role (optional), image (optional) }
 */
router.post('/register', publicController.register);

/**
 * GET /services
 * Get all services (optionally filtered by category)
 * Query params: ?category=interior
 */
router.get('/services', publicController.getServices);

/**
 * GET /services/:id
 * Get a single service by ID
 */
router.get('/services/:id', publicController.getServiceById);

module.exports = router;

