const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/role');
const adminController = require('../controllers/adminController');

router.use(verifyToken);
router.use(requireRole('admin'));

router.post('/services', adminController.createService);

router.put('/services/:id', adminController.updateService);

router.delete('/services/:id', adminController.deleteService);

router.get('/bookings', adminController.getAllBookings);

router.put('/bookings/:id/assign', adminController.assignDecorator);

router.put('/users/:id/make-decorator', adminController.makeDecorator);

router.get('/users', adminController.getAllUsers);

router.put('/decorators/:id/approve', adminController.approveDecorator);

router.put('/decorators/:id/disable', adminController.disableDecorator);

router.get('/decorators', adminController.getAllDecorators);

router.get('/analytics/revenue', adminController.getRevenueAnalytics);

router.get('/analytics/service-demand', adminController.getServiceDemandAnalytics);

module.exports = router;
