/**
 * Payment Controller
 * 
 * Handles payment processing using Stripe.
 * Creates payment intents and confirms payments.
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Payment = require('../models/Payment');

/**
 * Create a Stripe payment intent
 * POST /payments/create-intent
 * 
 * Creates a Stripe Payment Intent for a booking.
 * Returns the client secret for the frontend to complete the payment.
 */
exports.createPaymentIntent = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user._id;

    // Validate bookingId
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide bookingId.',
      });
    }

    // Find booking
    const booking = await Booking.findById(bookingId).populate('serviceId');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    // Verify user owns the booking
    if (booking.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to pay for this booking.',
      });
    }

    // Check if booking is already paid
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This booking has already been paid.',
      });
    }

    // Check if payment intent already exists
    const existingPayment = await Payment.findOne({
      bookingId,
      status: { $in: ['pending', 'succeeded'] },
    });

    if (existingPayment && existingPayment.status === 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed for this booking.',
      });
    }

    // Calculate amount (service cost in cents for Stripe)
    const service = booking.serviceId;
    const amountInCents = Math.round(service.cost * 100); // Convert to cents

    if (amountInCents <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount.',
      });
    }

    // Create or retrieve existing payment intent
    let paymentIntent;
    let paymentRecord;

    if (existingPayment && existingPayment.status === 'pending') {
      // Retrieve existing payment intent
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(existingPayment.stripeIntentId);
        paymentRecord = existingPayment;
      } catch (stripeError) {
        // If intent doesn't exist, create a new one
        paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: 'usd',
          metadata: {
            bookingId: bookingId.toString(),
            userId: userId.toString(),
            serviceName: service.service_name,
          },
        });

        // Update existing payment record
        paymentRecord = existingPayment;
        paymentRecord.stripeIntentId = paymentIntent.id;
        paymentRecord.amount = amountInCents;
        await paymentRecord.save();
      }
    } else {
      // Create new payment intent
      paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        metadata: {
          bookingId: bookingId.toString(),
          userId: userId.toString(),
          serviceName: service.service_name,
        },
      });

      // Create payment record
      paymentRecord = await Payment.create({
        bookingId,
        userId,
        amount: amountInCents,
        stripeIntentId: paymentIntent.id,
        status: 'pending',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment intent created successfully.',
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentId: paymentRecord._id,
        amount: amountInCents / 100, // Return in dollars for display
      },
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error creating payment intent. Please try again.',
      error: error.message,
    });
  }
};

/**
 * Confirm a payment
 * POST /payments/confirm
 * 
 * Confirms that a payment was successful.
 * Updates booking payment status and payment record.
 */
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentId, stripeIntentId } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!paymentId && !stripeIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either paymentId or stripeIntentId.',
      });
    }

    // Find payment record
    let payment;
    if (paymentId) {
      payment = await Payment.findById(paymentId);
    } else {
      payment = await Payment.findOne({ stripeIntentId });
    }

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found.',
      });
    }

    // Verify user owns the payment
    if (payment.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to confirm this payment.',
      });
    }

    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripeIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: `Payment not completed. Current status: ${paymentIntent.status}`,
        paymentStatus: paymentIntent.status,
      });
    }

    // Update payment record
    payment.status = 'succeeded';
    await payment.save();

    // Update booking payment status
    const booking = await Booking.findById(payment.bookingId);
    if (booking) {
      booking.paymentStatus = 'paid';
      if (booking.status === 'pending') {
        booking.status = 'confirmed';
      }
      await booking.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully.',
      data: {
        payment,
        booking,
      },
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment ID format.',
      });
    }

    // Handle Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid Stripe payment intent.',
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error confirming payment. Please try again.',
      error: error.message,
    });
  }
};

