/**
 * Booking Model
 * 
 * Represents a booking made by a user for a service.
 * Bookings can be assigned to decorators and have payment and status tracking.
 * 
 * Fields:
 * - userId: Reference to the User who made the booking
 * - serviceId: Reference to the Service being booked
 * - date: Date and time of the service
 * - location: Location where the service will be performed
 * - paymentStatus: Payment status - 'pending', 'paid', 'failed', 'refunded'
 * - status: Booking status - 'pending', 'confirmed', 'assigned', 'in-progress', 'completed', 'cancelled'
 * - decoratorId: Reference to the Decorator assigned to this booking (optional)
 * - createdAt: Timestamp when booking was created
 */

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service ID is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      validate: {
        validator: function (value) {
          return value > new Date();
        },
        message: 'Booking date must be in the future',
      },
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'assigned', 'in-progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    decoratorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Decorator',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ decoratorId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Booking', bookingSchema);

