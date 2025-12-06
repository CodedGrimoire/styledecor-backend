/**
 * Payment Model
 * 
 * Represents a payment transaction for a booking.
 * Tracks Stripe payment intents and payment confirmations.
 * 
 * Fields:
 * - bookingId: Reference to the Booking this payment is for
 * - userId: Reference to the User who made the payment
 * - amount: Payment amount in cents (Stripe format)
 * - stripeIntentId: Stripe Payment Intent ID
 * - status: Payment status - 'pending', 'succeeded', 'failed', 'canceled'
 * - createdAt: Timestamp when payment was created
 */

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be positive'],
    },
    stripeIntentId: {
      type: String,
      required: [true, 'Stripe Intent ID is required'],
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'canceled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);

