/**
 * User Model
 * 
 * Represents a user in the StyleDecor system.
 * Users can have different roles: 'user', 'admin', or 'decorator'.
 * 
 * Fields:
 * - name: User's full name
 * - email: User's email address (unique, required)
 * - firebaseUid: Firebase Authentication UID (unique, required)
 * - role: User role - 'user', 'admin', or 'decorator' (default: 'user')
 * - image: URL to user's profile image (optional)
 * - createdAt: Timestamp when user was created
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    firebaseUid: {
      type: String,
      required: [true, 'Firebase UID is required'],
      unique: true, // unique: true automatically creates an index
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'decorator'],
      default: 'user',
    },
    image: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Index for faster queries
// Note: email and firebaseUid already have indexes from unique: true
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);

