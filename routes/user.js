const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const userController = require('../controllers/userController');

router.use(verifyToken);

router.post('/bookings', userController.createBooking);

router.get('/bookings/me', userController.getMyBookings);

router.delete('/bookings/:id', userController.deleteBooking);

module.exports = router;
