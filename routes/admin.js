/**
 * Admin Routes
 * 
 * Routes for admin users.
 * All routes require authentication and admin role.
 */

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/role');
const adminController = require('../controllers/adminController');

// All admin routes require authentication and admin role
router.use(verifyToken);
router.use(requireRole('admin'));

/**
 * POST /admin/services
 * Create a new service
 * Body: { service_name, cost, unit, category, description, image? }
 */
router.post('/services', adminController.createService);

/**
 * PUT /admin/services/:id
 * Update a service
 * Body: { service_name?, cost?, unit?, category?, description?, image? }
 */
router.put('/services/:id', adminController.updateService);

/**
 * DELETE /admin/services/:id
 * Delete a service
 */
router.delete('/services/:id', adminController.deleteService);

/**
 * GET /admin/bookings
 * Get all bookings (optionally filtered)
 * Query params: ?status=pending&paymentStatus=paid
 */
router.get('/bookings', adminController.getAllBookings);

/**
 * PUT /admin/bookings/:id/assign
 * Assign a decorator to a booking
 * Body: { decoratorId }
 */
router.put('/bookings/:id/assign', adminController.assignDecorator);

/**
 * PUT /admin/users/:id/make-decorator
 * Convert a user to a decorator
 * Body: { specialties? }
 */
router.put('/users/:id/make-decorator', adminController.makeDecorator);

/**
 * PUT /admin/decorators/:id/approve
 * Approve a decorator
 */
router.put('/decorators/:id/approve', adminController.approveDecorator);

/**
 * PUT /admin/decorators/:id/disable
 * Disable a decorator
 */
router.put('/decorators/:id/disable', adminController.disableDecorator);

/**
 * GET /admin/analytics/revenue
 * Get revenue analytics
 * Query params: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/analytics/revenue', adminController.getRevenueAnalytics);

/**
 * GET /admin/analytics/service-demand
 * Get service demand analytics
 */
router.get('/analytics/service-demand', adminController.getServiceDemandAnalytics);

module.exports = router;

