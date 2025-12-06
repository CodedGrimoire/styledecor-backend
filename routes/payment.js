/**
 * Payment Routes
 * 
 * Routes for payment processing using Stripe.
 * All routes require authentication.
 */

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// All payment routes require authentication
router.use(verifyToken);

/**
 * POST /payments/create-intent
 * Create a Stripe payment intent for a booking
 * Body: { bookingId }
 */
router.post('/create-intent', paymentController.createPaymentIntent);

/**
 * POST /payments/confirm
 * Confirm that a payment was successful
 * Body: { paymentId?, stripeIntentId? }
 */
router.post('/confirm', paymentController.confirmPayment);

module.exports = router;

