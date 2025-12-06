/**
 * Decorator Routes
 * 
 * Routes for decorators.
 * All routes require authentication and decorator role.
 */

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/role');
const decoratorController = require('../controllers/decoratorController');

// All decorator routes require authentication and decorator role
router.use(verifyToken);
router.use(requireRole('decorator'));

/**
 * GET /decorator/projects
 * Get all projects assigned to the decorator
 */
router.get('/projects', decoratorController.getProjects);

/**
 * PUT /decorator/project/:bookingId/status
 * Update the status of an assigned project
 * Body: { status: 'assigned' | 'in-progress' | 'completed' }
 */
router.put('/project/:bookingId/status', decoratorController.updateProjectStatus);

module.exports = router;

