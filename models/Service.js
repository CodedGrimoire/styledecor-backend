/**
 * Service Model
 * 
 * Represents a decoration service offered in the StyleDecor platform.
 * Services are created by admins and can be booked by users.
 * 
 * Fields:
 * - service_name: Name of the service
 * - cost: Price of the service
 * - unit: Unit of measurement (e.g., 'per hour', 'per room', 'per project')
 * - category: Service category (e.g., 'interior', 'exterior', 'event')
 * - description: Detailed description of the service
 * - createdByEmail: Email of the admin who created the service
 * - image: URL to service image (optional)
 * - createdAt: Timestamp when service was created
 */

const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    service_name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },
    cost: {
      type: Number,
      required: [true, 'Cost is required'],
      min: [0, 'Cost must be a positive number'],
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
      enum: ['per hour', 'per room', 'per project', 'per square foot', 'flat rate'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: ['interior', 'exterior', 'event', 'commercial', 'residential', 'other'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    createdByEmail: {
      type: String,
      required: [true, 'Creator email is required'],
      lowercase: true,
      trim: true,
    },
    image: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
serviceSchema.index({ category: 1 });
serviceSchema.index({ createdByEmail: 1 });

module.exports = mongoose.model('Service', serviceSchema);

