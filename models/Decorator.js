/**
 * Decorator Model
 * 
 * Represents a decorator in the StyleDecor system.
 * Decorators are users who have been approved to provide decoration services.
 * 
 * Fields:
 * - userId: Reference to the User who is a decorator
 * - specialties: Array of specialty categories the decorator excels in
 * - rating: Average rating from completed bookings (0-5)
 * - status: Decorator status - 'pending', 'approved', 'disabled'
 * - createdAt: Timestamp when decorator profile was created
 */

const mongoose = require('mongoose');

const decoratorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    specialties: {
      type: [String],
      default: [],
      validate: {
        validator: function (value) {
          const allowedCategories = ['interior', 'exterior', 'event', 'commercial', 'residential', 'other'];
          return value.every((specialty) => allowedCategories.includes(specialty));
        },
        message: 'Specialties must be valid categories',
      },
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'disabled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
decoratorSchema.index({ status: 1 });
decoratorSchema.index({ rating: -1 });

module.exports = mongoose.model('Decorator', decoratorSchema);

