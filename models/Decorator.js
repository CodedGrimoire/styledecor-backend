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

decoratorSchema.index({ status: 1 });
decoratorSchema.index({ rating: -1 });

module.exports = mongoose.model('Decorator', decoratorSchema);
