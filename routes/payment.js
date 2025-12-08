const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

router.use(verifyToken);

router.post('/create-intent', paymentController.createPaymentIntent);

router.post('/confirm', paymentController.confirmPayment);

module.exports = router;
