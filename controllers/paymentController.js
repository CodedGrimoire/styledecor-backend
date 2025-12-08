const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Payment = require('../models/Payment');

exports.createPaymentIntent = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user._id;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide bookingId.',
      });
    }

    const booking = await Booking.findById(bookingId).populate('serviceId');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    if (booking.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to pay for this booking.',
      });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This booking has already been paid.',
      });
    }

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

    const service = booking.serviceId;
    const amountInCents = Math.round(service.cost * 100); // Convert to cents

    if (amountInCents <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount.',
      });
    }

    let paymentIntent;
    let paymentRecord;

    if (existingPayment && existingPayment.status === 'pending') {
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(existingPayment.stripeIntentId);
        paymentRecord = existingPayment;
      } catch (stripeError) {
        paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: 'usd',
          metadata: {
            bookingId: bookingId.toString(),
            userId: userId.toString(),
            serviceName: service.service_name,
          },
        });

        paymentRecord = existingPayment;
        paymentRecord.stripeIntentId = paymentIntent.id;
        paymentRecord.amount = amountInCents;
        await paymentRecord.save();
      }
    } else {
      paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        metadata: {
          bookingId: bookingId.toString(),
          userId: userId.toString(),
          serviceName: service.service_name,
        },
      });

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
        amount: amountInCents / 100,
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

exports.confirmPayment = async (req, res) => {
  try {
    const { paymentId, stripeIntentId } = req.body;
    const userId = req.user._id;

    if (!paymentId && !stripeIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either paymentId or stripeIntentId.',
      });
    }

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

    if (payment.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to confirm this payment.',
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripeIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: `Payment not completed. Current status: ${paymentIntent.status}`,
        paymentStatus: paymentIntent.status,
      });
    }

    payment.status = 'succeeded';
    await payment.save();

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
